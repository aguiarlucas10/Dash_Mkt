"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { TaskDialog } from "./TaskDialog";
import { STATUS_COLUMNS, type KanbanTask, type ProductOption, type UserOption, type GoalCategoryOption } from "./types";
import type { TaskStatus } from "@/generated/prisma/enums";

type Props = {
  initialTasks: KanbanTask[];
  products: ProductOption[];
  users: UserOption[];
  goalCategories: GoalCategoryOption[];
  canEdit: boolean;
};

async function fetchTasks(): Promise<KanbanTask[]> {
  const res = await fetch("/api/tasks");
  if (!res.ok) throw new Error("Falha ao carregar demandas");
  const data = await res.json();
  return data.tasks;
}

export function KanbanBoard({ initialTasks, products, users, goalCategories, canEdit }: Props) {
  const queryClient = useQueryClient();
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    initialData: initialTasks,
  });

  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [dialogTask, setDialogTask] = useState<KanbanTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const byStatus = useMemo(() => {
    const map = new Map<TaskStatus, KanbanTask[]>();
    STATUS_COLUMNS.forEach((c) => map.set(c.status, []));
    tasks.forEach((t) => map.get(t.status)?.push(t));
    return map;
  }, [tasks]);

  const moveMutation = useMutation({
    mutationFn: async ({ id, toStatus }: { id: string; toStatus: TaskStatus }) => {
      const res = await fetch(`/api/tasks/${id}/move`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Falha ao mover");
      }
      return res.json();
    },
    onMutate: async ({ id, toStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previous = queryClient.getQueryData<KanbanTask[]>(["tasks"]);
      queryClient.setQueryData<KanbanTask[]>(["tasks"], (current = []) =>
        current.map((t) => (t.id === id ? { ...t, status: toStatus } : t)),
      );
      return { previous };
    },
    onError: (err: Error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["tasks"], context.previous);
      toast.error(err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  function handleDragStart(event: DragStartEvent) {
    const t = event.active.data.current?.task as KanbanTask | undefined;
    if (t) setActiveTask(t);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const task = active.data.current?.task as KanbanTask | undefined;
    if (!task) return;
    const toStatus = over.id as TaskStatus;
    if (task.status === toStatus) return;
    moveMutation.mutate({ id: task.id, toStatus });
  }

  function openCreate() {
    setDialogTask(null);
    setDialogOpen(true);
  }
  function openEdit(task: KanbanTask) {
    setDialogTask(task);
    setDialogOpen(true);
  }

  return (
    <div className="p-6 space-y-4 flex-1 flex flex-col min-h-0">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kanban de criativos</h1>
          <p className="text-sm text-muted-foreground">
            Arraste cards entre colunas para mudar o status. Clique para editar.
          </p>
        </div>
        {canEdit && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nova demanda
          </Button>
        )}
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto">
          <div className="grid grid-flow-col auto-cols-[280px] gap-3 pb-2">
            {STATUS_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.status}
                status={col.status}
                label={col.label}
                tasks={byStatus.get(col.status) ?? []}
                onTaskClick={canEdit ? openEdit : () => {}}
              />
            ))}
          </div>
        </div>
        <DragOverlay>
          {activeTask && <KanbanCard task={activeTask} onClick={() => {}} isDragOverlay />}
        </DragOverlay>
      </DndContext>

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
