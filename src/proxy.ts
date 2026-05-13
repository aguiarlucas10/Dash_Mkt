import type { NextRequest } from "next/server";
import { refreshSupabaseSession } from "@/lib/supabase/proxy-session";

export async function proxy(request: NextRequest) {
  return refreshSupabaseSession(request);
}

export const config = {
  // Pula assets estáticos e rotas internas do Next; o resto passa pelo refresh.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
