import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { canEdit } from "@/lib/permissions";
import { updateStockoutItemSchema } from "@/lib/validators/stockout-item";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEdit(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateStockoutItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const item = await prisma.stockoutItem.update({
    where: { id },
    data: {
      ...(parsed.data.product !== undefined && { product: parsed.data.product }),
      ...(parsed.data.category !== undefined && { category: parsed.data.category }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
    },
  });
  return NextResponse.json({ item });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEdit(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  await prisma.stockoutItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
