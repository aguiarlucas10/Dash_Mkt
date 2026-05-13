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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { StockoutItemStatus } from "@/generated/prisma/enums";

export type StockoutItem = {
  id: string;
  product: string;
  category: string | null;
  status: StockoutItemStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: StockoutItem | null;
};

export function StockoutDialog({ open, onOpenChange, item }: Props) {
  const isEdit = Boolean(item);
  const queryClient = useQueryClient();
  const [product, setProduct] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<StockoutItemStatus>("ACTIVE");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setProduct(item?.product ?? "");
      setCategory(item?.category ?? "");
      setStatus(item?.status ?? "ACTIVE");
      setNotes(item?.notes ?? "");
    }
  }, [open, item]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        product: product.trim(),
        category: category.trim() || null,
        status,
        notes: notes.trim() || null,
      };
      const url = isEdit && item ? `/api/stockout-items/${item.id}` : "/api/stockout-items";
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
      queryClient.invalidateQueries({ queryKey: ["stockout-items"] });
      toast.success(isEdit ? "Ruptura atualizada" : "Ruptura criada");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!item) return;
      const res = await fetch(`/api/stockout-items/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao deletar");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockout-items"] });
      toast.success("Ruptura removida");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const canSubmit = product.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar ruptura" : "Adicionar ruptura"}</DialogTitle>
          <DialogDescription>
            Registre um produto ou categoria em ruptura. Use o status para marcar quando o estoque volta.
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
            <Label htmlFor="product">Produto *</Label>
            <Input
              id="product"
              required
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Ex: Brinco Solitário Ouro"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Brincos, Coleção Verão"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => v && setStatus(v as StockoutItemStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {status === "ACTIVE" ? "Ativo (em ruptura)" : "Inativo (voltou ao estoque)"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Ativo (em ruptura)</SelectItem>
                <SelectItem value="INACTIVE">Inativo (voltou ao estoque)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas internas, previsão de reposição, etc."
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            {isEdit && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (confirm("Remover essa ruptura?")) {
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
