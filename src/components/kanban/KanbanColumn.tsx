"use client";

import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./KanbanCard";
import type { KanbanTask } from "./types";

type Props = {
  status: KanbanTask["status"];
  label: string;
  tasks: KanbanTask[];
  onTaskClick: (task: KanbanTask) => void;
};

export function KanbanColumn({ status, label, tasks, onTaskClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg bg-muted/40 p-2 min-h-[300px] transition-colors",
        isOver && "bg-muted ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-center justify-between px-2 py-1 mb-2">
        <h3 className="text-sm font-medium">{label}</h3>
        <Badge variant="secondary" className="tabular-nums">{tasks.length}</Badge>
      </div>
      <div className="space-y-2 flex-1">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-muted-foreground/60 text-center py-6 italic">
            Arraste um card até aqui
          </p>
        )}
      </div>
    </div>
  );
}
