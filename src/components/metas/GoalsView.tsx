"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  endOfMonth,
  format,
  isWithinInterval,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskDialog } from "@/components/kanban/TaskDialog";
import { GoalDialog, type Goal } from "./GoalDialog";
import type { KanbanTask, UserOption } from "@/components/kanban/types";
import type { TaskStatus } from "@/generated/prisma/enums";

type Props = {
  initialTasks: KanbanTask[];
  initialGoals: Goal[];
  users: UserOption[];
  canEdit: boolean;
  isAdmin: boolean;
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  BRIEFING: "Briefing",
  IN_PRODUCTION: "Em produção",
  IN_REVIEW: "Em aprovação",
  APPROVED: "Aprovado",
  PUBLISHED: "Publicado",
  BLOCKED: "Bloqueado",
};

const DELIVERED_STATUSES: TaskStatus[] = ["APPROVED", "PUBLISHED"];

async function fetchTasks(): Promise<KanbanTask[]> {
  const res = await fetch("/api/tasks", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar tasks");
  const data = await res.json();
  return data.tasks;
}

async function fetchGoals(): Promise<Goal[]> {
  const res = await fetch("/api/goals", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar metas");
  const data = await res.json();
  return data.goals;
}

export function GoalsView({ initialTasks, initialGoals, users, canEdit, isAdmin }: Props) {
  const { data: tasks = initialTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    initialData: initialTasks,
  });
  const { data: goals = initialGoals } = useQuery({
    queryKey: ["goals"],
    queryFn: fetchGoals,
    initialData: initialGoals,
  });

  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [taskDialogTask, setTaskDialogTask] = useState<KanbanTask | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const monthStart = cursor;
  const monthEnd = endOfMonth(cursor);

  const goalForMonth = useMemo(() => {
    const key = format(monthStart, "yyyy-MM");
    return goals.find((g) => g.month.slice(0, 7) === key) ?? null;
  }, [goals, monthStart]);

  const tasksInMonth = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });
  }, [tasks, monthStart, monthEnd]);

  const delivered = tasksInMonth.filter((t) => DELIVERED_STATUSES.includes(t.status));
  const inFlight = tasksInMonth.filter((t) => !DELIVERED_STATUSES.includes(t.status));

  const deliveredCount = delivered.reduce((sum, t) => sum + t.creativeCount, 0);
  const inFlightCount = inFlight.reduce((sum, t) => sum + t.creativeCount, 0);
  const totalCount = deliveredCount + inFlightCount;

  const target = goalForMonth?.target ?? 0;
  const progressPct = target > 0 ? Math.min(100, Math.round((deliveredCount / target) * 100)) : 0;

  function openTaskDialog(task: KanbanTask) {
    if (!canEdit) return;
    setTaskDialogTask(task);
    setTaskDialogOpen(true);
  }

  const monthLabel = format(monthStart, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCursor(subMonths(cursor, 1))} title="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, 1))} title="Próximo mês">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCursor(startOfMonth(new Date()))}>
            Mês atual
          </Button>
          <h2 className="text-lg font-semibold tracking-tight ml-2 capitalize">{monthLabel}</h2>
        </div>
        {isAdmin && (
          <Button onClick={() => setGoalDialogOpen(true)}>
            {goalForMonth ? <><Pencil className="h-4 w-4" /> Editar meta</> : <><Plus className="h-4 w-4" /> Definir meta</>}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Meta" value={target} hint={target === 0 ? "Sem meta definida" : undefined} />
        <StatCard label="Realizado" value={deliveredCount} hint="Aprovado + Publicado" />
        <StatCard label="Em aberto" value={inFlightCount} hint="Resto das tasks do mês" />
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Progresso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold tabular-nums">
              {target > 0 ? `${progressPct}%` : "—"}
            </p>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  progressPct >= 100 ? "bg-green-500" : "bg-primary",
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividades do mês</CardTitle>
          <CardDescription>
            Tasks com prazo neste mês, agrupadas pelo status. Clique para abrir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Group
            title="Realizado"
            count={deliveredCount}
            tasks={delivered}
            tone="success"
            canEdit={canEdit}
            onTaskClick={openTaskDialog}
          />
          <Group
            title="Em aberto"
            count={inFlightCount}
            tasks={inFlight}
            tone="warning"
            canEdit={canEdit}
            onTaskClick={openTaskDialog}
          />
          {tasksInMonth.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma task com prazo neste mês.
            </p>
          )}
          {totalCount > 0 && goalForMonth?.notes && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground mb-1">Nota da meta</p>
              <p className="whitespace-pre-wrap">{goalForMonth.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <GoalDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        monthStart={monthStart}
        goal={goalForMonth}
      />
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={taskDialogTask}
        products={[]}
        users={users}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function Group({
  title,
  count,
  tasks,
  tone,
  canEdit,
  onTaskClick,
}: {
  title: string;
  count: number;
  tasks: KanbanTask[];
  tone: "success" | "warning";
  canEdit: boolean;
  onTaskClick: (task: KanbanTask) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Badge variant={tone === "success" ? "default" : "secondary"} className="tabular-nums">
          {count} criativos
        </Badge>
      </div>
      <div className="rounded-md border divide-y">
        {tasks.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={!canEdit}
            onClick={() => onTaskClick(t)}
            className={cn(
              "w-full flex items-center justify-between gap-3 px-3 py-2 text-left transition-colors",
              canEdit && "hover:bg-muted/50 cursor-pointer",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{t.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {t.subject ?? "—"} • {t.assignedTo?.name ?? t.assignedTo?.email ?? "Sem responsável"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="tabular-nums">×{t.creativeCount}</Badge>
              <Badge variant="outline">{STATUS_LABEL[t.status]}</Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
