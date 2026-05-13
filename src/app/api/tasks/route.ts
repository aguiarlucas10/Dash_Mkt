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

  const tasks = await prisma.creativeTask.findMany({
    include: { product: true, assignedTo: true },
    orderBy: [{ priority: "asc" }, { deadline: "asc" }],
  });

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
      type: parsed.data.type,
      priority: parsed.data.priority,
      deadline: parsed.data.deadline ?? null,
      assignedToId: parsed.data.assignedToId,
      platformTargets: parsed.data.platformTargets,
      assets: parsed.data.assets,
      requestedById: me.id,
    },
    include: { product: true, assignedTo: true },
  });

  return NextResponse.json({ task }, { status: 201 });
}
