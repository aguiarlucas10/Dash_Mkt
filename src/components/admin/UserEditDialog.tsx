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
import type { Role } from "@/generated/prisma/enums";

export type EditableUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: EditableUser | null;
  currentUserId: string;
};

const ROLES: Role[] = ["ADMIN", "EDITOR", "VIEWER"];
const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin: pode gerenciar usuários e tudo",
  EDITOR: "Editor: cria e edita demandas/rupturas",
  VIEWER: "Viewer: só visualiza",
};

export function UserEditDialog({ open, onOpenChange, user, currentUserId }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(user?.name ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "EDITOR");

  useEffect(() => {
    if (open && user) {
      setName(user.name ?? "");
      setRole(user.role);
    }
  }, [open, user]);

  const isSelf = user?.id === currentUserId;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null, role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Erro ao salvar");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário atualizado");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Erro ao remover");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário removido");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>
            {isSelf
              ? "Você está editando sua própria conta — não dá para se rebaixar nem se remover."
              : "Mude o nome ou a role. Para mudar o e-mail, é necessário editar no Supabase Auth."}
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
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={user?.email ?? ""} disabled />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como aparece no sistema"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={(v) => v && setRole(v as Role)}
              disabled={isSelf}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{ROLE_LABEL[role]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isSelf && (
              <p className="text-xs text-muted-foreground">
                Para trocar sua role, peça para outro admin fazer.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            {!isSelf && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (confirm(`Remover ${user?.email} do dashboard?\n\nA conta também é removida do Supabase Auth — o usuário não consegue mais logar.`)) {
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
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
