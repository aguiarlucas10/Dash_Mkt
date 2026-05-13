import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { createUserSchema } from "@/lib/validators/user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Esconde o placeholder de seed da listagem para uso em selects de UI.
  const users = await prisma.user.findMany({
    where: { email: { not: "sistema@dash.local" } },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const { email, name, password, role } = parsed.data;

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Service role não configurada" },
      { status: 500 },
    );
  }

  // Cria o auth.users via API admin do Supabase. email_confirm: true pula a
  // verificação por e-mail — útil porque é o admin criando para alguém.
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: name ? { name } : undefined,
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Erro ao criar no Supabase Auth" },
      { status: 400 },
    );
  }

  // Cria a linha correspondente no nosso schema. Se falhar aqui, fica órfão no
  // auth.users — fazemos rollback removendo o auth user.
  try {
    const user = await prisma.user.create({
      data: { id: authData.user.id, email, name: name ?? null, role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    await admin.auth.admin.deleteUser(authData.user.id).catch(() => {});
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao salvar no banco" },
      { status: 500 },
    );
  }
}
