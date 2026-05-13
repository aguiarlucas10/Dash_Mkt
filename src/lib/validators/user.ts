import { z } from "zod";
import { Role } from "@/generated/prisma/enums";

export const updateUserSchema = z.object({
  name: z.string().min(1).max(120).optional().nullable(),
  role: z.nativeEnum(Role).optional(),
});

export const createUserSchema = z.object({
  email: z.string().email().max(180),
  name: z.string().min(1).max(120).optional().nullable(),
  password: z.string().min(6).max(72),
  role: z.nativeEnum(Role).default(Role.EDITOR),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
