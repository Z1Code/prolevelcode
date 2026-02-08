import { hashSync, compareSync } from "bcryptjs";

const SALT_ROUNDS = 12;

export function hashPassword(plain: string): string {
  return hashSync(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return compareSync(plain, hash);
}
