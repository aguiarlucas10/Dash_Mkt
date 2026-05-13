import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { UsersList } from "@/components/admin/UsersList";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await getCurrentUser();
  if (!isAdmin(me) || !me) redirect("/dashboard");

  const users = await prisma.user.findMany({
    where: { email: { not: "sistema@dash.local" } },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  const initialUsers = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Quem está aqui tem acesso ao dashboard. Para liberar alguém novo, primeiro
          cadastre no Supabase Auth — no primeiro login a conta entra como{" "}
          <span className="font-medium">EDITOR</span> e você pode promover aqui.
        </p>
      </div>

      <UsersList initialUsers={initialUsers} currentUserId={me.id} />
    </div>
  );
}
