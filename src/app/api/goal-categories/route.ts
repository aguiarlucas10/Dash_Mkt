import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { createGoalCategorySchema } from "@/lib/validators/goal";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.goalCategory.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ categories });
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

  const parsed = createGoalCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const category = await prisma.goalCategory.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        color: parsed.data.color ?? null,
      },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique")) {
      return NextResponse.json({ error: "Já existe uma meta com esse nome" }, { status: 400 });
    }
    throw err;
  }
}
