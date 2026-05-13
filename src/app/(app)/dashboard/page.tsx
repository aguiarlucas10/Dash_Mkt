import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskStatus, AdStatus } from "@/generated/prisma/enums";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [taskCounts, activeStockouts, pausedAds, upcomingDeadlines] = await Promise.all([
    prisma.creativeTask.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.stockoutEvent.findMany({
      where: { endedAt: null },
      include: { product: true, affectedAds: true },
      orderBy: { startedAt: "desc" },
      take: 10,
    }),
    prisma.ad.count({ where: { status: AdStatus.PAUSED } }),
    prisma.creativeTask.findMany({
      where: {
        deadline: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        status: { notIn: [TaskStatus.PUBLISHED, TaskStatus.APPROVED] },
      },
      include: { product: true, assignedTo: true },
      orderBy: { deadline: "asc" },
      take: 10,
    }),
  ]);

  const byStatus = Object.fromEntries(taskCounts.map((c) => [c.status, c._count._all]));
  const totalTasks = taskCounts.reduce((sum, c) => sum + c._count._all, 0);
  const inProgress =
    (byStatus[TaskStatus.BRIEFING] ?? 0) +
    (byStatus[TaskStatus.IN_PRODUCTION] ?? 0) +
    (byStatus[TaskStatus.IN_REVIEW] ?? 0);

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
        <StatCard label="Tasks totais" value={totalTasks} />
        <StatCard label="Em produção" value={inProgress} />
        <StatCard label="Rupturas ativas" value={activeStockouts.length} tone={activeStockouts.length > 0 ? "warning" : undefined} />
        <StatCard label="Anúncios pausados" value={pausedAds} tone={pausedAds > 0 ? "warning" : undefined} />
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
                    {task.product?.name ?? "Sem produto"} •{" "}
                    {task.assignedTo?.name ?? "Sem responsável"}
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
            <CardDescription>Produtos sem estoque e anúncios afetados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeStockouts.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma ruptura ativa.</p>
            )}
            {activeStockouts.map((event) => (
              <Link
                key={event.id}
                href="/rupturas"
                className="flex items-center justify-between gap-2 rounded-md border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{event.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Desde {format(event.startedAt, "dd MMM", { locale: ptBR })} •{" "}
                    {event.affectedAds.length} an. afetado(s)
                  </p>
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
