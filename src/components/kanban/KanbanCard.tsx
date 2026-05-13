"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarClock, User as UserIcon } from "lucide-react";
import type { KanbanTask } from "./types";

type Props = {
  task: KanbanTask;
  onClick: () => void;
  isDragOverlay?: boolean;
};

const PRIORITY_VARIANT: Record<KanbanTask["priority"], "default" | "outline" | "destructive" | "secondary"> = {
  P0: "destructive",
  P1: "default",
  P2: "outline",
  P3: "secondary",
};

export function KanbanCard({ task, onClick, isDragOverlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: isDragOverlay,
  });

  const overdue = task.deadline && new Date(task.deadline) < new Date();
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <Card
      ref={isDragOverlay ? undefined : setNodeRef}
      style={style}
      {...(!isDragOverlay ? { ...listeners, ...attributes } : {})}
      onClick={(e) => {
        // Não abre modal se acabou de soltar um drag
        if (isDragging) return;
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "p-3 cursor-grab active:cursor-grabbing select-none transition-shadow",
        isDragging && "opacity-40",
        isDragOverlay && "shadow-lg ring-2 ring-primary/40 cursor-grabbing",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        <div className="flex items-center gap-1 shrink-0">
          {task.creativeCount > 1 && (
            <Badge variant="secondary" className="tabular-nums">×{task.creativeCount}</Badge>
          )}
          <Badge variant={PRIORITY_VARIANT[task.priority]}>{task.priority}</Badge>
        </div>
      </div>

      {(task.subject ?? task.product?.name) && (
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {task.subject ?? task.product?.name}
        </p>
      )}

      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground gap-2">
        <span className="flex items-center gap-1 truncate">
          <UserIcon className="h-3 w-3 shrink-0" />
          <span className="truncate">{task.assignedTo?.name ?? task.assignedTo?.email ?? "—"}</span>
        </span>
        {task.deadline && (
          <span
            className={cn(
              "flex items-center gap-1 shrink-0",
              overdue && "text-destructive font-medium",
            )}
          >
            <CalendarClock className="h-3 w-3" />
            {format(new Date(task.deadline), "dd MMM", { locale: ptBR })}
          </span>
        )}
      </div>
    </Card>
  );
}
