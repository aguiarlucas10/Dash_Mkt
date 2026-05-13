import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canEdit, isAdmin } from "@/lib/permissions";
import { GoalsView } from "@/components/metas/GoalsView";
import type { KanbanTask, UserOption, GoalCategoryOption } from "@/components/kanban/types";

export const dynamic = "force-dynamic";

export default async function MetasPage() {
  const me = await getCurrentUser();

  const [rawTasks, rawGoals, users, categories] = await Promise.all([
    prisma.creativeTask.findMany({
      include: { product: true, assignedTo: true, goalCategory: true },
      orderBy: [{ deadline: "asc" }, { priority: "asc" }],
    }),
    prisma.goal.findMany({
      include: { category: true },
      orderBy: [{ month: "desc" }, { category: { name: "asc" } }],
    }),
    prisma.user.findMany({
      where: { email: { not: "sistema@dash.local" } },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: { id: true, email: true, name: true },
    }),
    prisma.goalCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
  ]);

  const initialTasks: KanbanTask[] = rawTasks.map((t) => ({
    id: t.id,
    title: t.title,
    subject: t.subject,
    description: t.description,
    creativeCount: t.creativeCount,
    goalCategoryId: t.goalCategoryId,
    goalCategory: t.goalCategory
      ? { id: t.goalCategory.id, name: t.goalCategory.name, color: t.goalCategory.color }
      : null,
    type: t.type,
    priority: t.priority,
    status: t.status,
    deadline: t.deadline ? t.deadline.toISOString() : null,
    platformTargets: t.platformTargets,
    assets: t.assets,
    productId: t.productId,
    product: t.product
      ? { id: t.product.id, name: t.product.name, sku: t.product.sku }
      : null,
    assignedToId: t.assignedToId,
    assignedTo: t.assignedTo
      ? { id: t.assignedTo.id, name: t.assignedTo.name, email: t.assignedTo.email }
      : null,
    requestedById: t.requestedById,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  const initialGoals = rawGoals.map((g) => ({
    id: g.id,
    categoryId: g.categoryId,
    category: { id: g.category.id, name: g.category.name, color: g.category.color },
    month: g.month.toISOString(),
    target: g.target,
    notes: g.notes,
  }));

  return (
    <div className="p-6 space-y-4 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Metas</h1>
        <p className="text-sm text-muted-foreground">
          Tipos de meta separados (ex: Criativos de mídia, Ativações Studio). Cada um
          tem target mensal próprio; as tasks são vinculadas via dropdown "Meta".
        </p>
      </div>

      <GoalsView
        initialTasks={initialTasks}
        initialGoals={initialGoals}
        initialCategories={categories as GoalCategoryOption[]}
        users={users as UserOption[]}
        canEdit={canEdit(me)}
        isAdmin={isAdmin(me)}
      />
    </div>
  );
}
