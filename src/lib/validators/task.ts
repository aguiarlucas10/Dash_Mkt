import { z } from "zod";
import { TaskType, Priority, TaskStatus, Platform } from "@/generated/prisma/enums";

export const TaskTypeEnum = z.nativeEnum(TaskType);
export const PriorityEnum = z.nativeEnum(Priority);
export const TaskStatusEnum = z.nativeEnum(TaskStatus);
export const PlatformEnum = z.nativeEnum(Platform);

export const createTaskSchema = z.object({
  title: z.string().min(3).max(200),
  subject: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  productId: z.string().cuid().optional().nullable(),
  creativeCount: z.coerce.number().int().min(1).max(999).default(1),
  goalCategoryId: z.string().cuid().optional().nullable(),
  type: TaskTypeEnum,
  priority: PriorityEnum.default(Priority.P2),
  deadline: z.coerce.date().optional().nullable(),
  assignedToId: z.string().uuid(),
  platformTargets: z.array(PlatformEnum).default([]),
  assets: z.array(z.string().url()).default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  subject: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  productId: z.string().cuid().optional().nullable(),
  creativeCount: z.coerce.number().int().min(1).max(999).optional(),
  goalCategoryId: z.string().cuid().optional().nullable(),
  type: TaskTypeEnum.optional(),
  priority: PriorityEnum.optional(),
  deadline: z.coerce.date().optional().nullable(),
  assignedToId: z.string().uuid().optional(),
  platformTargets: z.array(PlatformEnum).optional(),
  assets: z.array(z.string().url()).optional(),
});

export const moveTaskSchema = z.object({
  toStatus: TaskStatusEnum,
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
