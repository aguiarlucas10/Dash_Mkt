import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { updateUserSchema } from "@/lib/validators/user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Role } from "@/generated/prisma/enums";

const PLACEHOLDER_EMAIL = "sistema@dash.local";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { email: true, role: true } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.email === PLACEHOLDER_EMAIL) {
    return NextResponse.json({ error: "Usuário do sistema não pode ser editado" }, { status: 400 });
  }

  // Bloqueia o admin de se rebaixar — evita lockout acidental.
  if (id === me.id && parsed.data.role && parsed.data.role !== Role.ADMIN) {
    return NextResponse.json(
      { error: "Você não pode rebaixar sua própria conta — peça para outro admin" },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.role !== undefined && { role: parsed.data.role }),
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;

  if (id === me.id) {
    return NextResponse.json({ error: "Você não pode remover sua própria conta" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.email === PLACEHOLDER_EMAIL) {
    return NextResponse.json({ error: "Usuário do sistema não pode ser removido" }, { status: 400 });
  }

  // Remove primeiro do auth.users para bloquear login imediatamente. Se isso
  // falhar (service_role não configurada), seguimos removendo só do nosso lado.
  try {
    const admin = createSupabaseAdminClient();
    await admin.auth.admin.deleteUser(id).catch(() => {});
  } catch {
    // service_role não configurada — segue com o delete local mesmo assim
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
