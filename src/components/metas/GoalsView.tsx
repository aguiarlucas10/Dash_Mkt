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
import { ChevronLeft, ChevronRight, Pencil, Plus, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskDialog } from "@/components/kanban/TaskDialog";
import { GoalDialog, type Goal } from "./GoalDialog";
import { GoalCategoryDialog, type EditableCategory } from "./GoalCategoryDialog";
import type { KanbanTask, UserOption, GoalCategoryOption } from "@/components/kanban/types";
import type { TaskStatus } from "@/generated/prisma/enums";

type Props = {
  initialTasks: KanbanTask[];
  initialGoals: Goal[];
  initialCategories: GoalCategoryOption[];
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
  const res = await fetch("/api/tasks");
  if (!res.ok) throw new Error("Falha ao carregar demandas");
  const data = await res.json();
  return data.tasks;
}

async function fetchGoals(): Promise<Goal[]> {
  const res = await fetch("/api/goals");
  if (!res.ok) throw new Error("Falha ao carregar metas");
  const data = await res.json();
  return data.goals;
}

async function fetchCategories(): Promise<GoalCategoryOption[]> {
  const res = await fetch("/api/goal-categories");
  if (!res.ok) throw new Error("Falha ao carregar categorias");
  const data = await res.json();
  return data.categories;
}

export function GoalsView({
  initialTasks,
  initialGoals,
  initialCategories,
  users,
  canEdit,
  isAdmin,
}: Props) {
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
  const { data: categories = initialCategories } = useQuery({
    queryKey: ["goal-categories"],
    queryFn: fetchCategories,
    initialData: initialCategories,
    staleTime: 5 * 60_000,
  });

  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [goalDialog, setGoalDialog] = useState<{
    open: boolean;
    categoryId: string;
    categoryName: string;
    goal: Goal | null;
  } | null>(null);
  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean;
    category: EditableCategory | null;
  } | null>(null);
  const [taskDialogTask, setTaskDialogTask] = useState<KanbanTask | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const monthStart = cursor;
  const monthEnd = endOfMonth(cursor);
  const monthKey = format(monthStart, "yyyy-MM");

  const tasksInMonth = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });
  }, [tasks, monthStart, monthEnd]);

  const goalsByCategory = useMemo(() => {
    const map = new Map<string, Goal>();
    for (const g of goals) {
      if (g.month.slice(0, 7) === monthKey) {
        map.set(g.categoryId, g);
      }
    }
    return map;
  }, [goals, monthKey]);

  const tasksByCategory = useMemo(() => {
    const map = new Map<string | null, KanbanTask[]>();
    for (const t of tasksInMonth) {
      const arr = map.get(t.goalCategoryId) ?? [];
      arr.push(t);
      map.set(t.goalCategoryId, arr);
    }
    return map;
  }, [tasksInMonth]);

  function openCreateCategory() {
    setCategoryDialog({ open: true, category: null });
  }
  function openEditCategory(c: GoalCategoryOption) {
    setCategoryDialog({
      open: true,
      category: { id: c.id, name: c.name, description: null, color: c.color },
    });
  }
  function openSetGoal(categoryId: string, categoryName: string) {
    setGoalDialog({
      open: true,
      categoryId,
      categoryName,
      goal: goalsByCategory.get(categoryId) ?? null,
    });
  }
  function openTaskDialog(task: KanbanTask) {
    if (!canEdit) return;
    setTaskDialogTask(task);
    setTaskDialogOpen(true);
  }

  const monthLabel = format(monthStart, "MMMM 'de' yyyy", { locale: ptBR });
  const uncategorizedTasks = tasksByCategory.get(null) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCursor(subMonths(cursor, 1))} aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, 1))} aria-label="Próximo mês">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCursor(startOfMonth(new Date()))}>
            Mês atual
          </Button>
          <h2 className="text-lg font-semibold tracking-tight ml-2 capitalize">{monthLabel}</h2>
        </div>
        {isAdmin && (
          <Button onClick={openCreateCategory}>
            <Plus className="h-4 w-4" />
            Nova meta
          </Button>
        )}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <Target className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma meta cadastrada ainda.
              {isAdmin && " Crie a primeira clicando em \"Nova meta\"."}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {categories.map((category) => {
          const goalForMonth = goalsByCategory.get(category.id) ?? null;
          const categoryTasks = tasksByCategory.get(category.id) ?? [];
          const delivered = categoryTasks.filter((t) => DELIVERED_STATUSES.includes(t.status));
          const inFlight = categoryTasks.filter((t) => !DELIVERED_STATUSES.includes(t.status));
          const deliveredCount = delivered.reduce((s, t) => s + t.creativeCount, 0);
          const inFlightCount = inFlight.reduce((s, t) => s + t.creativeCount, 0);
          const target = goalForMonth?.target ?? 0;
          const progressPct = target > 0 ? Math.min(100, Math.round((deliveredCount / target) * 100)) : 0;

          return (
            <Card key={category.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    {goalForMonth?.notes && (
                      <CardDescription className="mt-1">{goalForMonth.notes}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openSetGoal(category.id, category.name)}
                        aria-label={`Definir meta do mês para ${category.name}`}
                      >
                        <Target className="h-4 w-4" />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditCategory(category)}
                        aria-label={`Editar ou remover meta ${category.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <Stat label="Meta" value={target} hint={target === 0 ? "Sem meta no mês" : undefined} />
                  <Stat label="Realizado" value={deliveredCount} hint="Aprovado + Publicado" />
                  <Stat label="Em aberto" value={inFlightCount} hint="Resto das demandas" />
                  <div>
                    <p className="text-xs text-muted-foreground">Progresso</p>
                    <p className="text-2xl font-semibold tabular-nums mt-1">
                      {target > 0 ? `${progressPct}%` : "—"}
                    </p>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                      <div
                        className={cn(
                          "h-full transition-[width] duration-300",
                          progressPct >= 100 ? "bg-success" : "bg-primary",
                        )}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {categoryTasks.length > 0 && (
                  <TaskGroup tasks={categoryTasks} canEdit={canEdit} onTaskClick={openTaskDialog} />
                )}
                {categoryTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Nenhuma demanda vinculada com prazo neste mês.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}

        {uncategorizedTasks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-muted-foreground">Sem meta vinculada</CardTitle>
              <CardDescription>
                Demandas com prazo no mês que não pertencem a nenhuma meta. Vincule via Kanban.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaskGroup tasks={uncategorizedTasks} canEdit={canEdit} onTaskClick={openTaskDialog} />
            </CardContent>
          </Card>
        )}
      </div>

      {goalDialog && (
        <GoalDialog
          open={goalDialog.open}
          onOpenChange={(o) => setGoalDialog(o ? goalDialog : null)}
          monthStart={monthStart}
          categoryId={goalDialog.categoryId}
          categoryName={goalDialog.categoryName}
          goal={goalDialog.goal}
        />
      )}
      {categoryDialog && (
        <GoalCategoryDialog
          open={categoryDialog.open}
          onOpenChange={(o) => setCategoryDialog(o ? categoryDialog : null)}
          category={categoryDialog.category}
        />
      )}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={taskDialogTask}
        products={[]}
        users={users}
        goalCategories={categories}
      />
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tabular-nums mt-1">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function TaskGroup({
  tasks,
  canEdit,
  onTaskClick,
}: {
  tasks: KanbanTask[];
  canEdit: boolean;
  onTaskClick: (task: KanbanTask) => void;
}) {
  const sorted = [...tasks].sort((a, b) => {
    const aDone = DELIVERED_STATUSES.includes(a.status) ? 0 : 1;
    const bDone = DELIVERED_STATUSES.includes(b.status) ? 0 : 1;
    return aDone - bDone;
  });
  return (
    <div className="rounded-md border divide-y">
      {sorted.map((t) => (
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
            <Badge variant={DELIVERED_STATUSES.includes(t.status) ? "default" : "outline"}>
              {STATUS_LABEL[t.status]}
            </Badge>
          </div>
        </button>
      ))}
    </div>
  );
}
