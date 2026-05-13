import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { upsertGoalSchema } from "@/lib/validators/goal";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.goal.findMany({
    orderBy: { month: "desc" },
  });
  return NextResponse.json({ goals });
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = upsertGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const { month, target, notes } = parsed.data;
  const goal = await prisma.goal.upsert({
    where: { month },
    update: { target, notes: notes ?? null },
    create: { month, target, notes: notes ?? null },
  });
  return NextResponse.json({ goal });
}
