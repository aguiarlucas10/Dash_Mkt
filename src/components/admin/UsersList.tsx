"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Pencil, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserEditDialog, type EditableUser } from "./UserEditDialog";
import { UserCreateDialog } from "./UserCreateDialog";
import type { Role } from "@/generated/prisma/enums";

type UserRow = EditableUser & { createdAt: string };

type Props = {
  initialUsers: UserRow[];
  currentUserId: string;
};

const ROLE_VARIANT: Record<Role, "default" | "outline" | "secondary"> = {
  ADMIN: "default",
  EDITOR: "outline",
  VIEWER: "secondary",
};

async function fetchUsers(): Promise<UserRow[]> {
  const res = await fetch("/api/users", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar");
  const data = await res.json();
  return data.users.map((u: EditableUser) => ({
    ...u,
    createdAt: new Date().toISOString(),
  }));
}

export function UsersList({ initialUsers, currentUserId }: Props) {
  const { data: users = initialUsers } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    initialData: initialUsers,
    select: (incoming) =>
      incoming.map((u) => ({
        ...u,
        createdAt: initialUsers.find((iu) => iu.id === u.id)?.createdAt ?? u.createdAt,
      })),
  });

  const [editing, setEditing] = useState<EditableUser | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Adicionar usuário
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-mail</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Cadastrado em</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                  Nenhum usuário ainda. Use o botão acima para cadastrar.
                </TableCell>
              </TableRow>
            )}
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-mono text-xs">
                  {u.email}
                  {u.id === currentUserId && (
                    <Badge variant="secondary" className="ml-2">você</Badge>
                  )}
                </TableCell>
                <TableCell>{u.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={ROLE_VARIANT[u.role]}>{u.role}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(u.createdAt), "dd MMM yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(u);
                      setEditOpen(true);
                    }}
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={editing}
        currentUserId={currentUserId}
      />
      <UserCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
