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
  month: monthSchema,
  target: z.coerce.number().int().min(0).max(99999),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateGoalSchema = z.object({
  target: z.coerce.number().int().min(0).max(99999).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export type UpsertGoalInput = z.infer<typeof upsertGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
