import { Role } from "@/generated/prisma/enums";
import type { AppUser } from "@/lib/session";

export function isAdmin(user: AppUser | null | undefined): boolean {
  return user?.role === Role.ADMIN;
}

export function canEdit(user: AppUser | null | undefined): boolean {
  return user?.role === Role.ADMIN || user?.role === Role.EDITOR;
}

export function canView(user: AppUser | null | undefined): boolean {
  return Boolean(user?.role);
}
