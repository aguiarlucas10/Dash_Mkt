import type { TaskStatus, TaskType, Priority, Platform } from "@/generated/prisma/enums";

export type KanbanTask = {
  id: string;
  title: string;
  subject: string | null;
  description: string | null;
  type: TaskType;
  priority: Priority;
  status: TaskStatus;
  deadline: string | null; // ISO
  platformTargets: Platform[];
  assets: string[];
  productId: string | null;
  product: { id: string; name: string; sku: string } | null;
  assignedToId: string | null;
  assignedTo: { id: string; name: string | null; email: string } | null;
  requestedById: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductOption = { id: string; sku: string; name: string };
export type UserOption = { id: string; email: string; name: string | null };

export const STATUS_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "BACKLOG", label: "Backlog" },
  { status: "BRIEFING", label: "Briefing" },
  { status: "IN_PRODUCTION", label: "Em produção" },
  { status: "IN_REVIEW", label: "Em aprovação" },
  { status: "APPROVED", label: "Aprovado" },
  { status: "PUBLISHED", label: "Publicado" },
  { status: "BLOCKED", label: "Bloqueado" },
];

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  LAUNCH: "Lançamento",
  PROMO: "Promoção",
  EVERGREEN: "Evergreen",
  REPLACEMENT: "Substituição",
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  META: "Meta",
  TIKTOK: "TikTok",
  GOOGLE: "Google",
  YOUTUBE: "YouTube",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  P0: "P0 — Crítico",
  P1: "P1 — Alto",
  P2: "P2 — Médio",
  P3: "P3 — Baixo",
};
