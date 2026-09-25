import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, UserRoundX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/actions";
import { defaultWorkspace } from "@/lib/auth-routing";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AccessPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>;
}) {
  const { provider } = await searchParams;
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await db
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile && ["ADMIN", "INSPECTOR", "CONTRACTOR"].includes(profile.role)) {
    const { data: organization } = await db
      .from("organizations")
      .select("id")
      .eq("id", profile.organization_id)
      .maybeSingle();
    if (organization) redirect(defaultWorkspace(profile.role as Role));
  }
  return (
    <main className="access-page">
      <div className="access-card">
        <span className="brand-mark">
          <ShieldCheck size={25} />
        </span>
        <div className="access-icon">
          <UserRoundX size={28} />
        </div>
        <div className="eyebrow">
          {provider === "google"
            ? "GOOGLE-АККАУНТ ПОДТВЕРЖДЁН"
            : "АККАУНТ ПОДТВЕРЖДЁН"}
        </div>
        <h1>Доступ ещё не назначен</h1>
        <p>
          Для адреса <strong>{user.email}</strong> пока не предоставлен доступ к
          рабочему пространству KEPIL. Доступ назначается администратором
          организации.
        </p>
        <div className="button-row">
          <Link className="button secondary" href="/login?error=profile">
            Вернуться ко входу
          </Link>
          <form action={logoutAction}>
            <button className="button primary">Выйти</button>
          </form>
        </div>
      </div>
    </main>
  );
}
