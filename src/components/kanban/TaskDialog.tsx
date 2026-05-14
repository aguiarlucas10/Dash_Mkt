"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PLATFORM_LABEL,
  PRIORITY_LABEL,
  STATUS_COLUMNS,
  TASK_TYPE_LABEL,
  type KanbanTask,
  type ProductOption,
  type UserOption,
  type GoalCategoryOption,
} from "./types";
import type { TaskType, Priority, Platform, TaskStatus } from "@/generated/prisma/enums";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: KanbanTask | null;
  products: ProductOption[];
  users: UserOption[];
  goalCategories?: GoalCategoryOption[];
};

const NO_META = "__no_meta__";

const ALL_TASK_TYPES: TaskType[] = ["LAUNCH", "PROMO", "EVERGREEN", "REPLACEMENT"];
const ALL_PRIORITIES: Priority[] = ["P0", "P1", "P2", "P3"];
const ALL_PLATFORMS: Platform[] = ["META", "TIKTOK", "GOOGLE", "YOUTUBE"];

type FormState = {
  title: string;
  subject: string;
  description: string;
  creativeCount: number;
  goalCategoryId: string;
  type: TaskType;
  priority: Priority;
  deadline: string;
  assignedToId: string;
  platformTargets: Platform[];
  status: TaskStatus;
};

function emptyForm(task: KanbanTask | null): FormState {
  return {
    title: task?.title ?? "",
    subject: task?.subject ?? task?.product?.name ?? "",
    description: task?.description ?? "",
    creativeCount: task?.creativeCount ?? 1,
    goalCategoryId: task?.goalCategoryId ?? NO_META,
    type: task?.type ?? "EVERGREEN",
    priority: task?.priority ?? "P2",
    deadline: task?.deadline ? task.deadline.slice(0, 10) : "",
    assignedToId: task?.assignedToId ?? "",
    platformTargets: task?.platformTargets ?? [],
    status: task?.status ?? "BACKLOG",
  };
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  products: _products,
  users,
  goalCategories = [],
}: Props) {
  const isEdit = Boolean(task);
  const [form, setForm] = useState<FormState>(() => emptyForm(task));
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) setForm(emptyForm(task));
  }, [open, task]);

  const canSubmit = form.title.trim().length >= 3 && form.subject.trim().length > 0 && form.assignedToId.length > 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        subject: form.subject.trim(),
        description: form.description.trim() || null,
        creativeCount: form.creativeCount,
        goalCategoryId: form.goalCategoryId === NO_META ? null : form.goalCategoryId,
        type: form.type,
        priority: form.priority,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        assignedToId: form.assignedToId,
        platformTargets: form.platformTargets,
        ...(isEdit && task ? { status: form.status } : {}),
      };

      const url = isEdit && task ? `/api/tasks/${task.id}` : "/api/tasks";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Erro ao salvar");
      }
      return res.json();
    },
    onSuccess: async (data) => {
      // Se editou status, dispara um move adicional para registrar o StatusChange
      if (isEdit && task && data.task && task.status !== data.task.status) {
        await fetch(`/api/tasks/${task.id}/move`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ toStatus: data.task.status }),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(isEdit ? "Demanda atualizada" : "Demanda criada");
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!task) return;
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao deletar");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Demanda deletada");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusLabel = STATUS_COLUMNS.find((c) => c.status === form.status)?.label ?? form.status;
  const assignedUser = users.find((u) => u.id === form.assignedToId);
  const selectedGoal = goalCategories.find((g) => g.id === form.goalCategoryId);

  function togglePlatform(p: Platform) {
    setForm((prev) => ({
      ...prev,
      platformTargets: prev.platformTargets.includes(p)
        ? prev.platformTargets.filter((x) => x !== p)
        : [...prev.platformTargets, p],
    }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar criativo" : "Nova demanda de criativo"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os campos abaixo. Mudar o status registra a movimentação no histórico."
              : "Crie uma demanda de criativo. Ela entra no Backlog por padrão."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              required
              minLength={3}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Lançamento Colar Coração — vídeo 30s"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subject">Produto / Categoria / Coleção *</Label>
            <Input
              id="subject"
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Ex: Brinco Solitário, Coleção Verão 2026, Brincos Q3"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição / briefing</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Contexto, referências, observações"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select
                value={form.type}
                onValueChange={(v) => v && setForm({ ...form, type: v as TaskType })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{TASK_TYPE_LABEL[form.type]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ALL_TASK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{TASK_TYPE_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Prioridade *</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => v && setForm({ ...form, priority: v as Priority })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{PRIORITY_LABEL[form.priority]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ALL_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Responsável *</Label>
              <Select
                value={form.assignedToId || undefined}
                onValueChange={(v) => v && setForm({ ...form, assignedToId: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um responsável">
                    {assignedUser ? (assignedUser.name ?? assignedUser.email) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {users.length === 0 && (
                    <SelectItem value="__noop__" disabled>Sem usuários cadastrados</SelectItem>
                  )}
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name ?? u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deadline">Prazo</Label>
              <Input
                id="deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="creativeCount">Qtde de criativos *</Label>
              <Input
                id="creativeCount"
                type="number"
                min={1}
                max={999}
                step={1}
                value={form.creativeCount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    creativeCount: Math.max(1, Number(e.target.value) || 1),
                  })
                }
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Meta</Label>
              <Select
                value={form.goalCategoryId}
                onValueChange={(v) => v && setForm({ ...form, goalCategoryId: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {form.goalCategoryId === NO_META ? "Sem meta vinculada" : (selectedGoal?.name ?? "Sem meta vinculada")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_META}>Sem meta vinculada</SelectItem>
                  {goalCategories.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isEdit && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => v && setForm({ ...form, status: v as TaskStatus })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{statusLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_COLUMNS.map((c) => (
                      <SelectItem key={c.status} value={c.status}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Plataformas</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORMS.map((p) => {
                const selected = form.platformTargets.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className="focus:outline-none"
                  >
                    <Badge
                      variant={selected ? "default" : "outline"}
                      className={cn("cursor-pointer", selected ? "" : "hover:bg-muted")}
                    >
                      {PLATFORM_LABEL[p]}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            {isEdit && (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deleteMutation.isPending}
                      className="mr-auto"
                    />
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Deletar
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deletar essa demanda?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A demanda <strong>{task?.title}</strong> será removida junto com o histórico de movimentações entre status. Essa ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate()}>
                      Deletar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending || !canSubmit}>
              {saveMutation.isPending ? "Salvando…" : isEdit ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
