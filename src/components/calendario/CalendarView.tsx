"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TaskDialog } from "@/components/kanban/TaskDialog";
import type { KanbanTask, ProductOption, UserOption, GoalCategoryOption } from "@/components/kanban/types";
import type { Priority } from "@/generated/prisma/enums";

type Props = {
  initialTasks: KanbanTask[];
  products: ProductOption[];
  users: UserOption[];
  goalCategories: GoalCategoryOption[];
  canEdit: boolean;
};

type ViewMode = "month" | "week";

const PRIORITY_DOT: Record<Priority, string> = {
  P0: "bg-priority-p0",
  P1: "bg-priority-p1",
  P2: "bg-priority-p2",
  P3: "bg-priority-p3",
};

async function fetchTasks(): Promise<KanbanTask[]> {
  const res = await fetch("/api/tasks");
  if (!res.ok) throw new Error("Falha ao carregar demandas");
  const data = await res.json();
  return data.tasks;
}

export function CalendarView({ initialTasks, products, users, goalCategories, canEdit }: Props) {
  const { data: tasks = initialTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    initialData: initialTasks,
  });

  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<ViewMode>("month");
  const [dialogTask, setDialogTask] = useState<KanbanTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { days, header } = useMemo(() => {
    if (view === "month") {
      const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
      const list: Date[] = [];
      for (let d = start; d <= end; d = addDays(d, 1)) list.push(d);
      return { days: list, header: format(cursor, "MMMM 'de' yyyy", { locale: ptBR }) };
    }
    const start = startOfWeek(cursor, { weekStartsOn: 0 });
    const end = endOfWeek(cursor, { weekStartsOn: 0 });
    const list: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) list.push(d);
    return {
      days: list,
      header: `${format(start, "dd MMM", { locale: ptBR })} – ${format(end, "dd MMM yyyy", { locale: ptBR })}`,
    };
  }, [cursor, view]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, KanbanTask[]>();
    for (const t of tasks) {
      if (!t.deadline) continue;
      const key = t.deadline.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [tasks]);

  const agendaDays = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    const out: Array<{ day: Date; tasks: KanbanTask[] }> = [];
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const key = format(d, "yyyy-MM-dd");
      const dayTasks = tasksByDay.get(key);
      if (dayTasks && dayTasks.length > 0) {
        out.push({ day: d, tasks: dayTasks });
      }
    }
    return out;
  }, [cursor, tasksByDay]);

  const undated = tasks.filter((t) => !t.deadline);

  function goPrev() {
    setCursor((c) => (view === "month" ? subMonths(c, 1) : subWeeks(c, 1)));
  }
  function goNext() {
    setCursor((c) => (view === "month" ? addMonths(c, 1) : addWeeks(c, 1)));
  }
  function goToday() {
    setCursor(new Date());
  }

  function openTask(task: KanbanTask) {
    if (!canEdit) return;
    setDialogTask(task);
    setDialogOpen(true);
  }

  const weekdayLabels = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const mobileHeader = format(cursor, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="space-y-4 flex-1 flex flex-col min-h-0">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev} aria-label="Período anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goNext} aria-label="Próximo período">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToday}>Hoje</Button>
          <h2 className="text-lg font-semibold tracking-tight ml-2 capitalize">
            <span className="md:hidden">{mobileHeader}</span>
            <span className="hidden md:inline">{header}</span>
          </h2>
        </div>
        <Tabs
          value={view}
          onValueChange={(v) => v && setView(v as ViewMode)}
          className="hidden md:block"
        >
          <TabsList>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="md:hidden rounded-lg border divide-y">
        {agendaDays.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            Nenhum prazo nesse mês.
          </p>
        )}
        {agendaDays.map(({ day, tasks: dayTasks }) => (
          <div key={day.toISOString()} className="px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={cn(
                  "text-xs font-medium uppercase tracking-wide tabular-nums",
                  isToday(day) ? "text-primary" : "text-muted-foreground",
                )}
              >
                {format(day, "EEE, dd 'de' MMM", { locale: ptBR })}
              </span>
              {isToday(day) && (
                <Badge variant="default" className="h-4 text-[10px] px-1.5">Hoje</Badge>
              )}
            </div>
            <div className="space-y-1">
              {dayTasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => openTask(t)}
                  className="w-full text-left flex items-center gap-2 rounded-md border px-2 py-2 min-h-11 hover:bg-accent transition-colors"
                >
                  <span className={cn("h-2 w-2 rounded-full shrink-0", PRIORITY_DOT[t.priority])} />
                  <span className="flex-1 truncate text-sm">{t.title}</span>
                  {t.creativeCount > 1 && (
                    <span className="text-xs text-muted-foreground tabular-nums">×{t.creativeCount}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block rounded-lg border overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/50 border-b">
          {weekdayLabels.map((d) => (
            <div key={d} className="px-2 py-1.5 text-xs font-medium text-center uppercase tracking-wide text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        <div className={cn("grid grid-cols-7", view === "month" ? "auto-rows-[minmax(110px,1fr)]" : "auto-rows-[minmax(280px,1fr)]")}>
          {days.map((day, i) => {
            const inMonth = view === "week" || isSameMonth(day, cursor);
            const key = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDay.get(key) ?? [];
            return (
              <div
                key={i}
                className={cn(
                  "border-r border-b p-1.5 flex flex-col gap-1 min-w-0",
                  !inMonth && "bg-muted/20",
                )}
              >
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={cn(
                      "h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center tabular-nums",
                      !inMonth && "text-muted-foreground/50",
                      isToday(day) && "bg-primary text-primary-foreground font-medium",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayTasks.length > 0 && view === "month" && (
                    <span className="text-[10px] text-muted-foreground tabular-nums">{dayTasks.length}</span>
                  )}
                </div>
                <div className="space-y-1 overflow-hidden">
                  {dayTasks.slice(0, view === "month" ? 3 : 50).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => openTask(t)}
                      className="w-full text-left rounded px-1.5 py-0.5 text-xs bg-card border hover:bg-accent transition-colors flex items-center gap-1 group"
                      aria-label={`${t.title}${t.subject ? `, ${t.subject}` : ""}${t.assignedTo ? `, responsável ${t.assignedTo.name ?? t.assignedTo.email}` : ""}`}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", PRIORITY_DOT[t.priority])} />
                      <span className="truncate">{t.title}</span>
                      {t.creativeCount > 1 && (
                        <span className="text-muted-foreground tabular-nums ml-auto">×{t.creativeCount}</span>
                      )}
                    </button>
                  ))}
                  {view === "month" && dayTasks.length > 3 && (
                    <p className="text-[10px] text-muted-foreground px-1">+ {dayTasks.length - 3} mais</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {undated.length > 0 && (
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Sem prazo definido</h3>
            <Badge variant="outline" className="tabular-nums">{undated.length}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {undated.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => openTask(t)}
                className="rounded-md border px-2 py-1 text-xs hover:bg-accent transition-colors flex items-center gap-1"
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT[t.priority])} />
                {t.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={dialogTask}
        products={products}
        users={users}
        goalCategories={goalCategories}
      />
    </div>
  );
}
