import Link from "next/link";
import { Bell, ChevronRight, ShieldCheck } from "lucide-react";
import { getProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
export const dynamic = "force-dynamic";
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  const db = await createClient();
  const organization = profile.organization_id
    ? (
        await db
          .from("organizations")
          .select("name")
          .eq("id", profile.organization_id)
          .maybeSingle()
      ).data
    : null;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Перейти к содержимому
      </a>
      <Navigation
        profile={profile}
        organizationName={organization?.name ?? "Личный аккаунт"}
      />
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <ShieldCheck size={15} />
            <span>Муниципальная инфраструктура</span>
            <ChevronRight size={14} />
            <strong>Актау</strong>
          </div>
          <div className="topbar-right">
            {profile.role !== "USER" && (
              <Link
                className="icon-button"
                aria-label="Уведомления"
                href="/notifications"
              >
                <Bell size={19} />
              </Link>
            )}
          </div>
        </header>
        <main id="main" className="main-content">
          {children}
        </main>
        <footer className="workspace-footer">
          <span>KEPIL · Управление гарантийными обязательствами</span>
          <span>Демонстрационные сценарии инфраструктуры Актау</span>
        </footer>
      </div>
    </div>
  );
}
