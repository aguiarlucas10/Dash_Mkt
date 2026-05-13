import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { canEdit } from "@/lib/permissions";
import { updateTaskSchema } from "@/lib/validators/task";

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

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const task = await prisma.creativeTask.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.subject !== undefined && { subject: parsed.data.subject }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.productId !== undefined && { productId: parsed.data.productId }),
      ...(parsed.data.creativeCount !== undefined && { creativeCount: parsed.data.creativeCount }),
      ...(parsed.data.goalCategoryId !== undefined && { goalCategoryId: parsed.data.goalCategoryId }),
      ...(parsed.data.type !== undefined && { type: parsed.data.type }),
      ...(parsed.data.priority !== undefined && { priority: parsed.data.priority }),
      ...(parsed.data.deadline !== undefined && { deadline: parsed.data.deadline }),
      ...(parsed.data.assignedToId !== undefined && { assignedToId: parsed.data.assignedToId }),
      ...(parsed.data.platformTargets !== undefined && { platformTargets: parsed.data.platformTargets }),
      ...(parsed.data.assets !== undefined && { assets: parsed.data.assets }),
    },
    include: { product: true, assignedTo: true, goalCategory: true },
  });

  return NextResponse.json({ task });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEdit(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  await prisma.creativeTask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
