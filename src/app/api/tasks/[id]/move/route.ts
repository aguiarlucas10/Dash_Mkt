import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { canEdit } from "@/lib/permissions";
import { moveTaskSchema } from "@/lib/validators/task";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canEdit(me)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = moveTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.creativeTask.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!current) {
        throw new NotFound();
      }
      if (current.status === parsed.data.toStatus) {
        return tx.creativeTask.findUnique({ where: { id } });
      }
      const task = await tx.creativeTask.update({
        where: { id },
        data: { status: parsed.data.toStatus },
      });
      await tx.statusChange.create({
        data: {
          taskId: id,
          fromStatus: current.status,
          toStatus: parsed.data.toStatus,
          userId: me.id,
        },
      });
      return task;
    });

    return NextResponse.json({ task: updated });
  } catch (err) {
    if (err instanceof NotFound) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    console.error("Move task error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

class NotFound extends Error {}
