/* eslint-disable @typescript-eslint/no-explicit-any */
import type { cookies as cookieFn } from "next/headers";
import { firebaseAdminAuth, firebaseAdminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/session";

type AnyRow = Record<string, any>;

interface QueryError {
  message: string;
  code?: string;
}

interface QueryResult<T = AnyRow> {
  data: T[] | null;
  error: QueryError | null;
  count?: number | null;
}

interface SingleResult<T = AnyRow> {
  data: T | null;
  error: QueryError | null;
}

interface SelectOptions {
  count?: "exact";
  head?: boolean;
}

interface OrderRule {
  field: string;
  ascending: boolean;
}

interface FilterRule {
  op: "eq" | "gt" | "gte" | "lt";
  field: string;
  value: unknown;
}

type HeaderCookieStore = Awaited<ReturnType<typeof cookieFn>>;

interface CookieStoreLike {
  get: (name: string) => { value: string } | undefined;
  set?: HeaderCookieStore["set"] | ((name: string, value: string, options?: Record<string, unknown>) => void);
}

interface ClientContext {
  cookieStore?: CookieStoreLike;
}

function normalizeDateLike(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeDateLike(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, inner]) => inner !== undefined)
        .map(([key, inner]) => [key, normalizeDateLike(inner)]),
    );
  }

  return value;
}

function readValue(row: AnyRow, field: string) {
  if (field === "id") {
    return row.id;
  }

  if (!field.includes(".")) {
    return row[field];
  }

  return field.split(".").reduce<any>((acc, part) => {
    if (Array.isArray(acc)) {
      return acc[0]?.[part];
    }

    if (acc && typeof acc === "object") {
      return acc[part];
    }

    return undefined;
  }, row);
}

function compare(left: unknown, right: unknown) {
  if (typeof left === "number" && typeof right === "number") return left - right;
  if (typeof left === "string" && typeof right === "string") {
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  }
  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right);
  }

  const leftDate = new Date(String(left)).getTime();
  const rightDate = new Date(String(right)).getTime();

  if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
    return leftDate - rightDate;
  }

  return 0;
}

function extractRelations(selectClause?: string | null) {
  if (!selectClause) return [] as string[];

  const relations = new Set<string>();
  const pattern = /([a-zA-Z_]+)(?:![a-zA-Z_]+)?\s*\(/g;

  for (const match of selectClause.matchAll(pattern)) {
    if (match[1]) {
      relations.add(match[1]);
    }
  }

  return [...relations];
}

function getForeignKeyForRelation(relation: string) {
  const map: Record<string, string> = {
    users: "user_id",
    courses: "course_id",
    lessons: "lesson_id",
    modules: "module_id",
    services: "service_id",
  };

  return map[relation] ?? `${relation.slice(0, -1)}_id`;
}

async function getCollectionRows(table: string): Promise<AnyRow[]> {
  const snapshot = await firebaseAdminDb.collection(table).get();
  return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as AnyRow) }));
}

async function getDocById(collectionName: string, id: string): Promise<AnyRow | null> {
  const snap = await firebaseAdminDb.collection(collectionName).doc(id).get();
  if (!snap.exists) {
    return null;
  }

  return { id: snap.id, ...(snap.data() as AnyRow) };
}

async function expandRelations(table: string, rows: AnyRow[], selectClause?: string | null) {
  const relations = extractRelations(selectClause);

  if (relations.length === 0 || rows.length === 0) {
    return rows;
  }

  const docCache = new Map<string, AnyRow | null>();
  const collectionCache = new Map<string, AnyRow[]>();

  const getById = async (collectionName: string, id: string) => {
    const cacheKey = `${collectionName}:${id}`;

    if (docCache.has(cacheKey)) {
      return docCache.get(cacheKey) ?? null;
    }

    const value = await getDocById(collectionName, id);
    docCache.set(cacheKey, value);
    return value;
  };

  const getCollection = async (collectionName: string) => {
    if (collectionCache.has(collectionName)) {
      return collectionCache.get(collectionName) ?? [];
    }

    const value = await getCollectionRows(collectionName);
    collectionCache.set(collectionName, value);
    return value;
  };

  const expanded = await Promise.all(
    rows.map(async (row) => {
      const next = { ...row };

      for (const relation of relations) {
        if (relation === "lessons" && table === "modules") {
          const lessons = (await getCollection("lessons"))
            .filter((lesson) => lesson.module_id === row.id)
            .sort((left, right) => compare(left.sort_order, right.sort_order));

          next.lessons = lessons;
          continue;
        }

        const fk = getForeignKeyForRelation(relation);
        const relationId = row[fk];

        if (typeof relationId !== "string" || relationId.length === 0) {
          next[relation] = [];
          continue;
        }

        const related = await getById(relation, relationId);
        next[relation] = related ? [related] : [];
      }

      return next;
    }),
  );

  return expanded;
}

function setCookie(cookieStore: CookieStoreLike | undefined, name: string, value: string, options: Record<string, unknown>) {
  if (!cookieStore?.set) {
    return;
  }

  (cookieStore.set as any)(name, value, options);
}

class FirebaseTableQueryBuilder<T extends AnyRow = AnyRow> implements PromiseLike<QueryResult<T>> {
  private mode: "select" | "insert" | "update" | "upsert" = "select";
  private payload: AnyRow | AnyRow[] | null = null;
  private selectClause: string | null = null;
  private selectOptions: SelectOptions | null = null;
  private orderRules: OrderRule[] = [];
  private filters: FilterRule[] = [];
  private limitCount: number | null = null;
  private upsertConflict: string[] = [];

  constructor(private readonly table: string) {}

  select(columns?: string, options?: SelectOptions) {
    this.selectClause = columns ?? null;
    this.selectOptions = options ?? null;
    return this;
  }

  eq(field: string, value: unknown) {
    this.filters.push({ op: "eq", field, value });
    return this;
  }

  gt(field: string, value: unknown) {
    this.filters.push({ op: "gt", field, value });
    return this;
  }

  gte(field: string, value: unknown) {
    this.filters.push({ op: "gte", field, value });
    return this;
  }

  lt(field: string, value: unknown) {
    this.filters.push({ op: "lt", field, value });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderRules.push({ field, ascending: options?.ascending ?? true });
    return this;
  }

  limit(amount: number) {
    this.limitCount = amount;
    return this;
  }

  insert(payload: AnyRow | AnyRow[]) {
    this.mode = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: AnyRow) {
    this.mode = "update";
    this.payload = payload;
    return this;
  }

  upsert(payload: AnyRow | AnyRow[], options?: { onConflict?: string }) {
    this.mode = "upsert";
    this.payload = payload;
    this.upsertConflict = options?.onConflict?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
    return this;
  }

  async maybeSingle(): Promise<SingleResult<T>> {
    const result = await this.execute();
    return {
      data: result.data?.[0] ?? null,
      error: result.error,
    };
  }

  async single(): Promise<SingleResult<T>> {
    const result = await this.execute();

    if (result.error) {
      return { data: null, error: result.error };
    }

    if (!result.data || result.data.length === 0) {
      return { data: null, error: { message: `No rows found in ${this.table}` } };
    }

    return { data: result.data[0], error: null };
  }

  private applyFilters(rows: AnyRow[]) {
    return rows.filter((row) => {
      return this.filters.every((filter) => {
        const left = readValue(row, filter.field);

        if (filter.op === "eq") {
          return left === filter.value;
        }

        const compared = compare(left, filter.value);

        if (filter.op === "gt") return compared > 0;
        if (filter.op === "gte") return compared >= 0;
        if (filter.op === "lt") return compared < 0;
        return false;
      });
    });
  }

  private applySorting(rows: AnyRow[]) {
    if (this.orderRules.length === 0) {
      return rows;
    }

    const sorted = [...rows];

    sorted.sort((left, right) => {
      for (const rule of this.orderRules) {
        const compared = compare(readValue(left, rule.field), readValue(right, rule.field));
        if (compared !== 0) {
          return rule.ascending ? compared : -compared;
        }
      }

      return 0;
    });

    return sorted;
  }

  private async selectRowsRaw() {
    const rawRows = await getCollectionRows(this.table);
    let rows = this.applyFilters(rawRows);
    rows = this.applySorting(rows);

    const filteredCount = rows.length;

    if (typeof this.limitCount === "number") {
      rows = rows.slice(0, this.limitCount);
    }

    rows = await expandRelations(this.table, rows, this.selectClause);

    return { rows, filteredCount };
  }

  private async executeSelect(): Promise<QueryResult<T>> {
    const { rows, filteredCount } = await this.selectRowsRaw();

    if (this.selectOptions?.head) {
      return {
        data: null,
        error: null,
        count: filteredCount,
      };
    }

    return {
      data: rows as T[],
      error: null,
      count: this.selectOptions?.count === "exact" ? filteredCount : null,
    };
  }

  private async executeInsert(): Promise<QueryResult<T>> {
    const payloadArray = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
    const insertedRows: AnyRow[] = [];

    for (const payload of payloadArray) {
      const normalized = normalizeDateLike(payload) as AnyRow;
      const rawId = typeof normalized.id === "string" ? normalized.id : null;
      const dataWithoutId = { ...normalized };
      delete dataWithoutId.id;

      const idToUse = rawId ?? crypto.randomUUID();
      await firebaseAdminDb.collection(this.table).doc(idToUse).set(dataWithoutId, { merge: true });
      insertedRows.push({ id: idToUse, ...dataWithoutId });
    }

    return {
      data: insertedRows as T[],
      error: null,
      count: insertedRows.length,
    };
  }

  private async executeUpdate(): Promise<QueryResult<T>> {
    const payload = normalizeDateLike(this.payload ?? {}) as AnyRow;
    const allRows = await getCollectionRows(this.table);
    const rowsToUpdate = this.applyFilters(allRows);
    const updatedRows: AnyRow[] = [];

    for (const row of rowsToUpdate) {
      const rowId = typeof row.id === "string" ? row.id : null;
      if (!rowId) continue;

      const merged = { ...row, ...payload };
      const writePayload = { ...merged };
      delete writePayload.id;
      await firebaseAdminDb.collection(this.table).doc(rowId).set(writePayload, { merge: true });
      updatedRows.push({ id: rowId, ...writePayload });
    }

    return {
      data: updatedRows as T[],
      error: null,
      count: updatedRows.length,
    };
  }

  private async executeUpsert(): Promise<QueryResult<T>> {
    const payloadArray = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
    const allRows = await getCollectionRows(this.table);
    const affected: AnyRow[] = [];

    for (const payload of payloadArray) {
      const normalized = normalizeDateLike(payload) as AnyRow;
      const explicitId = typeof normalized.id === "string" ? normalized.id : null;
      const writeData = { ...normalized };
      delete writeData.id;

      let targetId = explicitId;

      if (!targetId && this.upsertConflict.length > 0) {
        const existing = allRows.find((row) => this.upsertConflict.every((field) => row[field] === normalized[field]));
        targetId = typeof existing?.id === "string" ? existing.id : null;
      }

      if (!targetId) {
        targetId = crypto.randomUUID();
      }

      await firebaseAdminDb.collection(this.table).doc(targetId).set(writeData, { merge: true });
      affected.push({ id: targetId, ...writeData });
    }

    return {
      data: affected as T[],
      error: null,
      count: affected.length,
    };
  }

  async execute(): Promise<QueryResult<T>> {
    try {
      if (this.mode === "insert") return await this.executeInsert();
      if (this.mode === "update") return await this.executeUpdate();
      if (this.mode === "upsert") return await this.executeUpsert();
      return await this.executeSelect();
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Unknown Firebase query error",
        },
      };
    }
  }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled ?? undefined, onrejected ?? undefined);
  }
}

async function ensureUserProfile(input: { uid: string; email?: string | null; name?: string | null; picture?: string | null }) {
  const userRef = firebaseAdminDb.collection("users").doc(input.uid);
  const existing = await userRef.get();
  const shouldBeAdmin = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
    .includes((input.email ?? "").toLowerCase());

  const existingData = existing.data() as AnyRow | undefined;

  const payload: AnyRow = {
    email: input.email ?? "",
    full_name: input.name ?? null,
    avatar_url: input.picture ?? null,
    role: shouldBeAdmin ? "superadmin" : existingData?.role ?? "student",
    is_active: existingData?.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (!existing.exists) {
    payload.created_at = new Date().toISOString();
  }

  await userRef.set(payload, { merge: true });
}

async function firebaseAuthRequest<T>(path: string, body: Record<string, unknown>) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/${path}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as T & { error?: { message?: string } };

  if (!response.ok || payload.error) {
    const message = payload.error?.message ?? "Firebase auth request failed";
    throw new Error(message);
  }

  return payload;
}

export class FirebaseSupabaseCompatClient {
  constructor(private readonly context: ClientContext = {}) {}

  auth = {
    getUser: async () => {
      const session = this.context.cookieStore?.get(SESSION_COOKIE_NAME)?.value ?? null;

      if (!session) {
        return { data: { user: null }, error: null };
      }

      try {
        const decoded = await firebaseAdminAuth.verifySessionCookie(session, true);
        await ensureUserProfile({
          uid: decoded.uid,
          email: decoded.email,
          name: typeof decoded.name === "string" ? decoded.name : null,
          picture: typeof decoded.picture === "string" ? decoded.picture : null,
        });

        return {
          data: {
            user: {
              id: decoded.uid,
              email: decoded.email ?? null,
            },
          },
          error: null,
        };
      } catch {
        return { data: { user: null }, error: null };
      }
    },
    signOut: async () => {
      setCookie(this.context.cookieStore, SESSION_COOKIE_NAME, "", {
        maxAge: 0,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      return { error: null };
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        const payload = await firebaseAuthRequest<{ idToken: string; localId: string; email: string; displayName?: string }>(
          "accounts:signInWithPassword",
          {
            email,
            password,
            returnSecureToken: true,
          },
        );

        const sessionCookie = await firebaseAdminAuth.createSessionCookie(payload.idToken, {
          expiresIn: 60 * 60 * 24 * 7 * 1000,
        });

        setCookie(this.context.cookieStore, SESSION_COOKIE_NAME, sessionCookie, {
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });

        await ensureUserProfile({
          uid: payload.localId,
          email: payload.email,
          name: payload.displayName ?? null,
        });

        return { data: { user: { id: payload.localId, email: payload.email } }, error: null };
      } catch (error) {
        return { data: { user: null }, error: { message: error instanceof Error ? error.message : "Sign-in failed" } };
      }
    },
    signUp: async ({
      email,
      password,
      options,
    }: {
      email: string;
      password: string;
      options?: { data?: { full_name?: string }; emailRedirectTo?: string };
    }) => {
      try {
        const created = await firebaseAuthRequest<{ idToken: string; localId: string; email: string }>("accounts:signUp", {
          email,
          password,
          returnSecureToken: true,
        });

        if (options?.data?.full_name) {
          await firebaseAuthRequest("accounts:update", {
            idToken: created.idToken,
            displayName: options.data.full_name,
            returnSecureToken: true,
          });
        }

        await firebaseAuthRequest("accounts:sendOobCode", {
          requestType: "VERIFY_EMAIL",
          idToken: created.idToken,
          continueUrl: options?.emailRedirectTo,
        });

        await ensureUserProfile({
          uid: created.localId,
          email: created.email,
          name: options?.data?.full_name ?? null,
        });

        return { data: { user: { id: created.localId, email: created.email } }, error: null };
      } catch (error) {
        return { data: { user: null }, error: { message: error instanceof Error ? error.message : "Sign-up failed" } };
      }
    },
    signInWithOtp: async ({
      email,
      options,
    }: {
      email: string;
      options?: { emailRedirectTo?: string };
    }) => {
      try {
        await firebaseAuthRequest("accounts:sendOobCode", {
          requestType: "EMAIL_SIGNIN",
          email,
          continueUrl: options?.emailRedirectTo,
          canHandleCodeInApp: true,
        });

        return { data: { user: null }, error: null };
      } catch (error) {
        return { data: { user: null }, error: { message: error instanceof Error ? error.message : "Magic link failed" } };
      }
    },
    resetPasswordForEmail: async (email: string, options?: { redirectTo?: string }) => {
      try {
        await firebaseAuthRequest("accounts:sendOobCode", {
          requestType: "PASSWORD_RESET",
          email,
          continueUrl: options?.redirectTo,
        });

        return { data: null, error: null };
      } catch (error) {
        return { data: null, error: { message: error instanceof Error ? error.message : "Password reset failed" } };
      }
    },
  };

  from<T extends AnyRow = AnyRow>(table: string) {
    return new FirebaseTableQueryBuilder<T>(table);
  }

  async rpc(functionName: string, args: Record<string, unknown>) {
    try {
      if (functionName === "check_rate_limit") {
        const route = String(args.p_route ?? "");
        const actorKey = String(args.p_actor_key ?? "");
        const maxHits = Number(args.p_max_hits ?? 10);
        const windowSeconds = Number(args.p_window_seconds ?? 60);

        await firebaseAdminDb.collection("rate_limit_events").doc(crypto.randomUUID()).set({
          route,
          actor_key: actorKey,
          created_at: new Date().toISOString(),
        });

        const rows = await getCollectionRows("rate_limit_events");
        const cutoff = Date.now() - windowSeconds * 1000;

        const hits = rows.filter((item) => {
          const sameActor = item.route === route && item.actor_key === actorKey;
          if (!sameActor) return false;
          const createdAt = new Date(String(item.created_at ?? "")).getTime();
          return !Number.isNaN(createdAt) && createdAt >= cutoff;
        }).length;

        return {
          data: hits <= maxHits,
          error: null,
        };
      }

      return {
        data: null,
        error: { message: `Unsupported rpc function: ${functionName}` },
      };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : "RPC failed" },
      };
    }
  }
}
