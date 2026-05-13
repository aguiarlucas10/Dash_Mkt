import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { updateGoalSchema } from "@/lib/validators/goal";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      ...(parsed.data.target !== undefined && { target: parsed.data.target }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
    },
  });
  return NextResponse.json({ goal });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
