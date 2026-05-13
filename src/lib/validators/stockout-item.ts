import { z } from "zod";
import { StockoutItemStatus } from "@/generated/prisma/enums";

export const createStockoutItemSchema = z.object({
  product: z.string().min(1).max(200),
  category: z.string().max(120).optional().nullable(),
  status: z.nativeEnum(StockoutItemStatus).default(StockoutItemStatus.ACTIVE),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateStockoutItemSchema = z.object({
  product: z.string().min(1).max(200).optional(),
  category: z.string().max(120).optional().nullable(),
  status: z.nativeEnum(StockoutItemStatus).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateStockoutItemInput = z.infer<typeof createStockoutItemSchema>;
export type UpdateStockoutItemInput = z.infer<typeof updateStockoutItemSchema>;
