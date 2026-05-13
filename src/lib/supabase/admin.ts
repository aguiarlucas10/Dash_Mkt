import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com service_role key. Bypassa RLS e pode chamar `auth.admin.*`
 * para criar/deletar usuários. NUNCA importar fora de Route Handlers ou Server
 * Components — a chave de serviço não pode vazar para o navegador.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada — necessária para criar usuários via dashboard",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
