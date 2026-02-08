import type { UserRole } from "@/lib/types";

export function isAdminRole(role: UserRole) {
  return role === "admin" || role === "superadmin";
}

export function isSuperAdminRole(role: UserRole) {
  return role === "superadmin";
}


