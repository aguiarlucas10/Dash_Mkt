import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canEdit } from "@/lib/permissions";
import { CalendarView } from "@/components/calendario/CalendarView";
import type { KanbanTask, UserOption, GoalCategoryOption } from "@/components/kanban/types";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const me = await getCurrentUser();

  const [rawTasks, users, goalCategories] = await Promise.all([
    prisma.creativeTask.findMany({
      include: {
        product: true,
        assignedTo: true,
        goalCategory: true,
        statusHistory: {
          where: { toStatus: "APPROVED" },
          orderBy: { at: "asc" },
          take: 1,
          select: { at: true },
        },
      },
      orderBy: [{ deadline: "asc" }, { priority: "asc" }],
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
    approvedAt: t.statusHistory[0]?.at?.toISOString() ?? null,
  }));

  return (
    <div className="p-6 space-y-4 flex-1 flex flex-col min-h-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calendário</h1>
        <p className="text-sm text-muted-foreground">
          Criativos plotados pelo prazo. Clique em um item para editar.
        </p>
      </div>

      <CalendarView
        initialTasks={initialTasks}
        products={[]}
        users={users as UserOption[]}
        goalCategories={goalCategories as GoalCategoryOption[]}
        canEdit={canEdit(me)}
      />
    </div>
  );
}
