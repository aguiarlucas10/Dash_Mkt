import { z } from "zod";

// month: aceita "YYYY-MM" ou um Date. Sempre normalizamos para o dia 1 do mês.
const monthSchema = z
  .union([z.string().regex(/^\d{4}-\d{2}$/), z.coerce.date()])
  .transform((v) => {
    if (typeof v === "string") {
      const [year, month] = v.split("-").map(Number);
      return new Date(Date.UTC(year, month - 1, 1));
    }
    return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), 1));
  });

export const upsertGoalSchema = z.object({
  categoryId: z.string().cuid(),
  month: monthSchema,
  target: z.coerce.number().int().min(0).max(99999),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateGoalSchema = z.object({
  target: z.coerce.number().int().min(0).max(99999).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const createGoalCategorySchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .nullable(),
});

export const updateGoalCategorySchema = createGoalCategorySchema.partial();

export type UpsertGoalInput = z.infer<typeof upsertGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateGoalCategoryInput = z.infer<typeof createGoalCategorySchema>;
export type UpdateGoalCategoryInput = z.infer<typeof updateGoalCategorySchema>;
