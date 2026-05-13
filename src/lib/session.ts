import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { Role } from "@/generated/prisma/enums";

export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

const PLACEHOLDER_EMAIL = "sistema@dash.local";

/**
 * Retorna o usuário autenticado mapeado para nossa tabela `User`, ou null.
 *
 * Allowlist: vive no próprio Supabase Auth — quem o admin não criou lá não
 * consegue logar. Quando alguém loga pela primeira vez, criamos a linha
 * correspondente em `User`:
 *   - se ainda não há admin "real" na tabela → vira ADMIN (bootstrap)
 *   - caso contrário → entra como EDITOR; admin promove depois se quiser
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return null;

  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, role: true },
  });
  if (existing) return existing;

  // Conta apenas usuários "reais" (não o placeholder do seed) para decidir
  // se este é o primeiro admin a entrar.
  const realUsers = await prisma.user.count({
    where: { email: { not: PLACEHOLDER_EMAIL } },
  });

  const name =
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ??
    user.email.split("@")[0];

  const created = await prisma.user.create({
    data: {
      id: user.id,
      email: user.email,
      name,
      role: realUsers === 0 ? Role.ADMIN : Role.EDITOR,
    },
    select: { id: true, email: true, name: true, role: true },
  });
  return created;
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
