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

export type EditableCategory = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: EditableCategory | null;
};

export function GoalCategoryDialog({ open, onOpenChange, category }: Props) {
  const isEdit = Boolean(category);
  const queryClient = useQueryClient();
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "");
      setDescription(category?.description ?? "");
    }
  }, [open, category]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
      };
      const url = isEdit && category
        ? `/api/goal-categories/${category.id}`
        : "/api/goal-categories";
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goal-categories"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success(isEdit ? "Meta atualizada" : "Meta criada");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!category) return;
      const res = await fetch(`/api/goal-categories/${category.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goal-categories"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Meta removida");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const canSubmit = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar tipo de meta" : "Nova meta"}</DialogTitle>
          <DialogDescription>
            Tipos de meta organizam categorias separadas — ex: "Criativos de mídia",
            "Ativações com Influenciadores no Studio". Cada uma tem target mensal próprio.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Ativações com Influenciadores no Studio"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhe o que entra nessa meta"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            {isEdit && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (confirm(`Remover a meta "${category?.name}"?\n\nAs tasks vinculadas ficam sem meta. As metas mensais dessa categoria são apagadas.`)) {
                    deleteMutation.mutate();
                  }
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
            <Button type="submit" disabled={!canSubmit || saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
