import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { canEdit } from "@/lib/permissions";
import { createStockoutItemSchema } from "@/lib/validators/stockout-item";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.stockoutItem.findMany({
    orderBy: [{ status: "asc" }, { product: "asc" }],
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEdit(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createStockoutItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const item = await prisma.stockoutItem.create({
    data: {
      product: parsed.data.product,
      category: parsed.data.category ?? null,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
    },
  });
  return NextResponse.json({ item }, { status: 201 });
}
