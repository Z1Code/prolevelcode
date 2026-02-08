-- ============================================================
-- PROLEVELCODE INITIAL SCHEMA
-- ============================================================

create extension if not exists pgcrypto;
create extension if not exists pg_cron;

-- ============================================================
-- HELPERS
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- USERS
-- ============================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text not null default 'student' check (role in ('student', 'admin', 'superadmin')),
  stripe_customer_id text,
  is_active boolean not null default true,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- Mirror auth.users -> public.users
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.users.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_created();

create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set
    email = new.email,
    full_name = coalesce(new.raw_user_meta_data->>'full_name', public.users.full_name),
    avatar_url = coalesce(new.raw_user_meta_data->>'avatar_url', public.users.avatar_url),
    updated_at = now()
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update on auth.users
for each row execute function public.handle_auth_user_updated();

-- ============================================================
-- CATALOG TABLES
-- ============================================================
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  long_description text,
  thumbnail_url text,
  preview_video_url text,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD',
  stripe_price_id text,
  stripe_product_id text,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  category text,
  tags text[],
  total_duration_minutes integer,
  total_lessons integer,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  launch_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_courses_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  youtube_video_id text not null,
  duration_minutes integer,
  sort_order integer not null,
  is_free_preview boolean not null default false,
  resources jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  short_description text,
  long_description text,
  icon text,
  price_range text,
  delivery_time text,
  features text[],
  is_featured boolean not null default false,
  sort_order integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_role text,
  author_avatar_url text,
  content text not null,
  rating integer check (rating between 1 and 5),
  service_or_course text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order integer,
  created_at timestamptz not null default now()
);

create table if not exists public.site_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger trg_site_config_updated_at
before update on public.site_config
for each row execute function public.set_updated_at();

-- ============================================================
-- COMMERCE TABLES
-- ============================================================
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  amount_paid_cents integer,
  currency text not null default 'USD',
  status text not null default 'active' check (status in ('active', 'refunded', 'expired')),
  enrolled_at timestamptz not null default now(),
  unique(user_id, course_id)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  is_completed boolean not null default false,
  watched_seconds integer not null default 0,
  last_watched_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(user_id, lesson_id)
);

create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  status text not null default 'pending_payment' check (status in ('pending_payment', 'pending_kickoff', 'in_progress', 'completed', 'cancelled', 'refunded')),
  quoted_amount_cents integer not null check (quoted_amount_cents > 0),
  paid_amount_cents integer,
  currency text not null default 'USD',
  customer_config jsonb,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  no_refund_accepted_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_service_orders_updated_at
before update on public.service_orders
for each row execute function public.set_updated_at();

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  stripe_payment_intent_id text unique not null,
  amount_cents integer not null,
  currency text not null,
  status text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.stripe_events (
  id uuid primary key default gen_random_uuid(),
  event_id text unique not null,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TOKEN TABLES
-- ============================================================
create table if not exists public.video_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  user_id uuid not null references public.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  expires_at timestamptz not null,
  max_views integer not null default 1,
  current_views integer not null default 0,
  ttl_seconds integer not null default 14400,
  ip_address inet,
  user_agent text,
  allowed_ips inet[],
  is_revoked boolean not null default false,
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create table if not exists public.token_usage_logs (
  id uuid primary key default gen_random_uuid(),
  token_id uuid not null references public.video_tokens(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  ip_address inet,
  user_agent text,
  action text not null check (action in ('generated', 'validated', 'viewed', 'expired', 'revoked', 'rejected')),
  rejection_reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- OPERATIONS TABLES
-- ============================================================
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  service_interest text,
  budget_range text,
  message text not null,
  is_read boolean not null default false,
  is_archived boolean not null default false,
  admin_notes text,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  target_table text,
  target_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.rate_limit_events (
  id bigserial primary key,
  route text not null,
  actor_key text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES (FK + COMPOSITE + PARTIAL)
-- ============================================================
create index if not exists idx_modules_course_id on public.modules(course_id);
create index if not exists idx_lessons_module_id on public.lessons(module_id);
create index if not exists idx_lessons_course_id on public.lessons(course_id);
create index if not exists idx_enrollments_user_id on public.enrollments(user_id);
create index if not exists idx_enrollments_course_id on public.enrollments(course_id);
create index if not exists idx_enrollments_user_status on public.enrollments(user_id, status);
create index if not exists idx_progress_user_id on public.lesson_progress(user_id);
create index if not exists idx_progress_lesson_id on public.lesson_progress(lesson_id);
create index if not exists idx_progress_course_id on public.lesson_progress(course_id);
create index if not exists idx_service_orders_user_id on public.service_orders(user_id);
create index if not exists idx_service_orders_service_id on public.service_orders(service_id);
create index if not exists idx_service_orders_status_created on public.service_orders(status, created_at desc);
create index if not exists idx_tokens_user_id on public.video_tokens(user_id);
create index if not exists idx_tokens_lesson_id on public.video_tokens(lesson_id);
create index if not exists idx_tokens_course_id on public.video_tokens(course_id);
create index if not exists idx_tokens_expiry on public.video_tokens(expires_at) where is_revoked = false;
create index if not exists idx_tokens_active_user_lesson on public.video_tokens(user_id, lesson_id, expires_at desc)
where is_revoked = false and current_views < max_views;
create index if not exists idx_token_logs_token_id on public.token_usage_logs(token_id);
create index if not exists idx_token_logs_user_id on public.token_usage_logs(user_id);
create index if not exists idx_contact_created on public.contact_messages(created_at desc);
create index if not exists idx_audit_admin_created on public.admin_audit_logs(admin_user_id, created_at desc);
create index if not exists idx_rate_limit_lookup on public.rate_limit_events(route, actor_key, created_at desc);
create index if not exists idx_courses_published_launch on public.courses(is_published, launch_date desc);
create index if not exists idx_courses_featured on public.courses(is_featured) where is_published = true;
create index if not exists idx_services_active_sort on public.services(is_active, sort_order);
create index if not exists idx_testimonials_public on public.testimonials(is_published, sort_order);

-- ============================================================
-- FUNCTIONS FOR AUTH/RLS
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = (select auth.uid())
      and role in ('admin', 'superadmin')
      and is_active = true
  );
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = (select auth.uid())
      and role = 'superadmin'
      and is_active = true
  );
$$;

create or replace function public.check_rate_limit(
  p_route text,
  p_actor_key text,
  p_max_hits integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hits integer;
begin
  insert into public.rate_limit_events(route, actor_key)
  values (p_route, p_actor_key);

  select count(*)
  into v_hits
  from public.rate_limit_events
  where route = p_route
    and actor_key = p_actor_key
    and created_at >= now() - make_interval(secs => p_window_seconds);

  return v_hits <= p_max_hits;
end;
$$;

create or replace function public.cleanup_expired_tokens()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  with deleted_tokens as (
    delete from public.video_tokens
    where expires_at < now()
    returning id, user_id, ip_address, user_agent
  )
  insert into public.token_usage_logs(token_id, user_id, ip_address, user_agent, action, rejection_reason, metadata)
  select id, user_id, ip_address, user_agent, 'expired', 'expired', jsonb_build_object('source', 'cron_cleanup')
  from deleted_tokens;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- ============================================================
-- RLS
-- ============================================================
alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.video_tokens enable row level security;
alter table public.token_usage_logs enable row level security;
alter table public.services enable row level security;
alter table public.service_orders enable row level security;
alter table public.contact_messages enable row level security;
alter table public.testimonials enable row level security;
alter table public.site_config enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.stripe_events enable row level security;
alter table public.rate_limit_events enable row level security;

alter table public.users force row level security;
alter table public.enrollments force row level security;
alter table public.lesson_progress force row level security;
alter table public.video_tokens force row level security;
alter table public.token_usage_logs force row level security;
alter table public.service_orders force row level security;
alter table public.contact_messages force row level security;
alter table public.admin_audit_logs force row level security;
alter table public.site_config force row level security;

-- users
create policy users_select_self on public.users
for select to authenticated
using (id = (select auth.uid()));

create policy users_update_self on public.users
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy users_admin_read_all on public.users
for select to authenticated
using ((select public.is_admin()));

create policy users_superadmin_update_all on public.users
for update to authenticated
using ((select public.is_superadmin()))
with check ((select public.is_superadmin()));

-- courses/modules/lessons
create policy courses_public_read on public.courses
for select to anon, authenticated
using (is_published = true or (select public.is_admin()));

create policy courses_admin_write on public.courses
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy modules_public_read on public.modules
for select to anon, authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = modules.course_id
      and (c.is_published = true or (select public.is_admin()))
  )
);

create policy modules_admin_write on public.modules
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy lessons_public_read on public.lessons
for select to anon, authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = lessons.course_id
      and (c.is_published = true or (select public.is_admin()))
  )
);

create policy lessons_admin_write on public.lessons
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- services/testimonials
create policy services_public_read on public.services
for select to anon, authenticated
using (is_active = true or (select public.is_admin()));

create policy services_admin_write on public.services
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy testimonials_public_read on public.testimonials
for select to anon, authenticated
using (is_published = true or (select public.is_admin()));

create policy testimonials_admin_write on public.testimonials
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- enrollments/progress
create policy enrollments_select_own on public.enrollments
for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy enrollments_insert_own on public.enrollments
for insert to authenticated
with check (user_id = (select auth.uid()) or (select public.is_admin()));

create policy enrollments_update_admin on public.enrollments
for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy lesson_progress_own on public.lesson_progress
for all to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()))
with check (user_id = (select auth.uid()) or (select public.is_admin()));

-- tokens
create policy video_tokens_select_own on public.video_tokens
for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy video_tokens_insert_own on public.video_tokens
for insert to authenticated
with check (user_id = (select auth.uid()) or (select public.is_admin()));

create policy video_tokens_update_admin_or_owner on public.video_tokens
for update to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()))
with check (user_id = (select auth.uid()) or (select public.is_admin()));

create policy token_logs_select_own on public.token_usage_logs
for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy token_logs_insert_admin on public.token_usage_logs
for insert to authenticated
with check ((select public.is_admin()) or user_id = (select auth.uid()));

-- service orders
create policy service_orders_select_own on public.service_orders
for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy service_orders_insert_own on public.service_orders
for insert to authenticated
with check (user_id = (select auth.uid()) or (select public.is_admin()));

create policy service_orders_update_admin on public.service_orders
for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- contact
create policy contact_insert_public on public.contact_messages
for insert to anon, authenticated
with check (true);

create policy contact_admin_read on public.contact_messages
for select to authenticated
using ((select public.is_admin()));

create policy contact_admin_update on public.contact_messages
for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- admin-only ops tables
create policy site_config_admin on public.site_config
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy admin_audit_admin on public.admin_audit_logs
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy payment_transactions_admin_read on public.payment_transactions
for select to authenticated
using ((select public.is_admin()));

create policy stripe_events_admin_read on public.stripe_events
for select to authenticated
using ((select public.is_superadmin()));

create policy rate_limit_events_admin_read on public.rate_limit_events
for select to authenticated
using ((select public.is_admin()));

-- ============================================================
-- GRANTS
-- ============================================================
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant execute on function public.check_rate_limit(text, text, integer, integer) to anon, authenticated, service_role;
grant execute on function public.cleanup_expired_tokens() to service_role;

-- ============================================================
-- SEEDS
-- ============================================================
insert into public.site_config (key, value)
values
('site_name', '"ProLevelCode"'::jsonb),
('site_tagline', '"Desarrollo Web & IA de Clase Mundial"'::jsonb),
('hero_title', '"Transformo ideas en productos digitales con IA"'::jsonb),
('hero_subtitle', '"Desarrollador Full-Stack especializado en crear soluciones web potenciadas por IA"'::jsonb),
('social_links', '{"github":"","twitter":"","linkedin":"","youtube":""}'::jsonb),
('token_default_ttl', '14400'::jsonb),
('token_default_max_views', '3'::jsonb),
('contact_email', '"hola@tumarca.com"'::jsonb),
('stripe_mode', '"test"'::jsonb)
on conflict (key) do nothing;

-- ============================================================
-- CRON JOBS
-- ============================================================
do $$
begin
  if not exists (select 1 from cron.job where jobname = 'cleanup-expired-video-tokens') then
    perform cron.schedule('cleanup-expired-video-tokens', '*/5 * * * *', $$select public.cleanup_expired_tokens();$$);
  end if;

  if not exists (select 1 from cron.job where jobname = 'cleanup-rate-limit-events') then
    perform cron.schedule('cleanup-rate-limit-events', '0 * * * *', $$delete from public.rate_limit_events where created_at < now() - interval '24 hours';$$);
  end if;
end $$;

