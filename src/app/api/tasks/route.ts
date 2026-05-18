import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { canEdit } from "@/lib/permissions";
import { createTaskSchema } from "@/lib/validators/task";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await prisma.creativeTask.findMany({
    include: {
      product: true,
      assignedTo: true,
      goalCategory: true,
      // approvedAt: primeira movimentação para APPROVED. Usado pra contar
      // "Realizado" em metas pelo mês de aprovação, não pelo deadline original.
      statusHistory: {
        where: { toStatus: "APPROVED" },
        orderBy: { at: "asc" },
        take: 1,
        select: { at: true },
      },
    },
    orderBy: [{ priority: "asc" }, { deadline: "asc" }],
  });

  const tasks = raw.map(({ statusHistory, ...rest }) => ({
    ...rest,
    approvedAt: statusHistory[0]?.at ?? null,
  }));

  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canEdit(me)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const task = await prisma.creativeTask.create({
    data: {
      title: parsed.data.title,
      subject: parsed.data.subject,
      description: parsed.data.description ?? null,
      productId: parsed.data.productId ?? null,
      creativeCount: parsed.data.creativeCount,
      goalCategoryId: parsed.data.goalCategoryId ?? null,
      type: parsed.data.type,
      priority: parsed.data.priority,
      deadline: parsed.data.deadline ?? null,
      assignedToId: parsed.data.assignedToId,
      platformTargets: parsed.data.platformTargets,
      assets: parsed.data.assets,
      requestedById: me.id,
    },
    include: { product: true, assignedTo: true, goalCategory: true },
  });

  return NextResponse.json({ task }, { status: 201 });
}
