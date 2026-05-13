"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { StockoutDialog, type StockoutItem } from "./StockoutDialog";

type Props = {
  initialItems: StockoutItem[];
  canEdit: boolean;
};

async function fetchItems(): Promise<StockoutItem[]> {
  const res = await fetch("/api/stockout-items", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar");
  const data = await res.json();
  return data.items;
}

export function StockoutsList({ initialItems, canEdit }: Props) {
  const queryClient = useQueryClient();
  const { data: items = initialItems } = useQuery({
    queryKey: ["stockout-items"],
    queryFn: fetchItems,
    initialData: initialItems,
  });

  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [editing, setEditing] = useState<StockoutItem | null>(null);
  const [open, setOpen] = useState(false);

  const toggleStatusMutation = useMutation({
    mutationFn: async (item: StockoutItem) => {
      const newStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const res = await fetch(`/api/stockout-items/${item.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Erro ao alterar status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockout-items"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = items.filter((i) => filter === "ALL" || i.status === filter);

  return (
    <>
      <div className="flex items-end justify-between gap-2 flex-wrap">
        <div className="w-40">
          <Select value={filter} onValueChange={(v) => v && setFilter(v as typeof filter)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {filter === "ALL" ? "Todos" : filter === "ACTIVE" ? "Ativos" : "Inativos"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="ACTIVE">Ativos</SelectItem>
              <SelectItem value="INACTIVE">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canEdit && (
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Adicionar ruptura
          </Button>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                  Nenhuma ruptura {filter === "ACTIVE" ? "ativa" : filter === "INACTIVE" ? "inativa" : "registrada"}.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.product}</TableCell>
                <TableCell className="text-muted-foreground">{item.category ?? "—"}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    disabled={!canEdit || toggleStatusMutation.isPending}
                    onClick={() => canEdit && toggleStatusMutation.mutate(item)}
                    className={canEdit ? "cursor-pointer" : "cursor-default"}
                    title={canEdit ? "Clique para alternar" : undefined}
                  >
                    <Badge variant={item.status === "ACTIVE" ? "destructive" : "secondary"}>
                      {item.status === "ACTIVE" ? "Ativo" : "Inativo"}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(item);
                        setOpen(true);
                      }}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <StockoutDialog open={open} onOpenChange={setOpen} item={editing} />
    </>
  );
}
