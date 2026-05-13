import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SearchParams = Promise<{ error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  // Distingue "logado mas sem allowlist" de "anônimo"
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const loggedButBlocked = Boolean(authUser);

  const { error } = await searchParams;

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Dash Criativos</CardTitle>
          <CardDescription>
            Acesso restrito ao time. Entre com seu e-mail e senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm initialError={error} loggedButBlocked={loggedButBlocked} />
        </CardContent>
      </Card>
    </main>
  );
}
