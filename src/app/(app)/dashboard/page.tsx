import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskStatus, StockoutItemStatus } from "@/generated/prisma/enums";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [taskCounts, activeStockouts, upcomingDeadlines] = await Promise.all([
    prisma.creativeTask.groupBy({
      by: ["status"],
      _sum: { creativeCount: true },
      _count: { _all: true },
    }),
    prisma.stockoutItem.findMany({
      where: { status: StockoutItemStatus.ACTIVE },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.creativeTask.findMany({
      where: {
        deadline: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        status: { notIn: [TaskStatus.PUBLISHED, TaskStatus.APPROVED] },
      },
      include: { assignedTo: true },
      orderBy: { deadline: "asc" },
      take: 10,
    }),
  ]);

  const sumByStatus = (statuses: TaskStatus[]) =>
    taskCounts
      .filter((c) => statuses.includes(c.status))
      .reduce((acc, c) => acc + (c._sum.creativeCount ?? 0), 0);

  const totalCreatives = taskCounts.reduce((acc, c) => acc + (c._sum.creativeCount ?? 0), 0);
  const inProgressCreatives = sumByStatus([
    TaskStatus.BRIEFING,
    TaskStatus.IN_PRODUCTION,
    TaskStatus.IN_REVIEW,
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
          <p className="text-sm text-muted-foreground">Como o time de criativos está agora.</p>
        </div>
        <Link href="/kanban" className={buttonVariants()}>
          Abrir Kanban
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Criativos totais" value={totalCreatives} />
        <StatCard label="Em produção" value={inProgressCreatives} />
        <StatCard
          label="Rupturas ativas"
          value={activeStockouts.length}
          tone={activeStockouts.length > 0 ? "warning" : undefined}
        />
        <StatCard label="Prazos próximos 7d" value={upcomingDeadlines.length} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prazos nos próximos 7 dias</CardTitle>
            <CardDescription>Tasks em andamento que vencem em breve.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingDeadlines.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum prazo crítico.</p>
            )}
            {upcomingDeadlines.map((task) => (
              <Link
                key={task.id}
                href="/kanban"
                className="flex items-center justify-between gap-2 rounded-md border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {task.subject ?? "—"} • {task.assignedTo?.name ?? task.assignedTo?.email ?? "Sem responsável"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant="outline">{task.priority}</Badge>
                  {task.deadline && (
                    <span className="text-xs text-muted-foreground">
                      {format(task.deadline, "dd MMM", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rupturas ativas</CardTitle>
            <CardDescription>Produtos sem estoque agora.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeStockouts.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma ruptura ativa.</p>
            )}
            {activeStockouts.map((item) => (
              <Link
                key={item.id}
                href="/rupturas"
                className="flex items-center justify-between gap-2 rounded-md border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.product}</p>
                  {item.category && (
                    <p className="text-xs text-muted-foreground truncate">{item.category}</p>
                  )}
                </div>
                <Badge variant="destructive">Ativa</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "warning" }) {
  return (
    <Card className={tone === "warning" ? "border-destructive/30" : undefined}>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-semibold tabular-nums ${tone === "warning" ? "text-destructive" : ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
