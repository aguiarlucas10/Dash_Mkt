import { z } from "zod";

export const createStockoutSchema = z.object({
  productId: z.string().cuid(),
  startedAt: z.coerce.date(),
  notes: z.string().max(2000).optional().nullable(),
  affectedAdIds: z.array(z.string().cuid()).default([]),
});

export const closeStockoutSchema = z.object({
  endedAt: z.coerce.date(),
});

export type CreateStockoutInput = z.infer<typeof createStockoutSchema>;
export type CloseStockoutInput = z.infer<typeof closeStockoutSchema>;
