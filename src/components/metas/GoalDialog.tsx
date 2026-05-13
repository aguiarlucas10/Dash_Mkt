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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type Goal = {
  id: string;
  month: string; // ISO date
  target: number;
  notes: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Mês alvo (sempre dia 1 em UTC). Se já houver Goal nesse mês, vem em `goal`.
  monthStart: Date;
  goal: Goal | null;
};

export function GoalDialog({ open, onOpenChange, monthStart, goal }: Props) {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<number>(goal?.target ?? 0);
  const [notes, setNotes] = useState(goal?.notes ?? "");

  useEffect(() => {
    if (open) {
      setTarget(goal?.target ?? 0);
      setNotes(goal?.notes ?? "");
    }
  }, [open, goal]);

  const monthKey = format(monthStart, "yyyy-MM");
  const monthLabel = format(monthStart, "MMMM 'de' yyyy", { locale: ptBR });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          month: monthKey,
          target,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Erro ao salvar");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta salva");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!goal) return;
      const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao deletar");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta removida");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">Meta de {monthLabel}</DialogTitle>
          <DialogDescription>
            Quantos criativos o time pretende entregar neste mês.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="target">Meta (qtde de criativos) *</Label>
            <Input
              id="target"
              type="number"
              min={0}
              max={99999}
              required
              value={target}
              onChange={(e) => setTarget(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contexto da meta, ações de venda etc."
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            {goal && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (confirm("Remover a meta deste mês?")) deleteMutation.mutate();
                }}
                disabled={deleteMutation.isPending}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4" />
                Remover
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
