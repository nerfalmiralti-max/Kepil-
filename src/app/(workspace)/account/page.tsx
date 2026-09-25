import Link from "next/link";
import { ShieldCheck, UserRound, Building2, ArrowRight } from "lucide-react";
import { getProfile } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { date, roleNames } from "@/lib/labels";

export default async function AccountPage() {
  const profile = await getProfile();
  return (
    <>
      <PageHeader
        eyebrow="ЛИЧНЫЙ КАБИНЕТ"
        title="Мой аккаунт"
        description="Ваш доступ к KEPIL создан автоматически и привязан к подтверждённому email."
      />
      <div className="account-grid">
        <section className="panel account-panel">
          <div className="account-panel-icon">
            <UserRound size={25} />
          </div>
          <h2>{profile.full_name}</h2>
          <p className="muted">{profile.email}</p>
          <div className="account-facts">
            <div>
              <span>Роль</span>
              <strong>{roleNames[profile.role]}</strong>
            </div>
            <div>
              <span>Организация</span>
              <strong>
                {profile.organization_id ? "Назначена" : "Не назначена"}
              </strong>
            </div>
            <div>
              <span>Аккаунт создан</span>
              <strong>{date(profile.created_at)}</strong>
            </div>
          </div>
        </section>
        <section className="panel account-panel account-intro">
          <div className="account-panel-icon">
            <ShieldCheck size={25} />
          </div>
          <h2>KEPIL: город на гарантии</h2>
          <p>
            Платформа связывает городские объекты, гарантийные сроки,
            подрядчиков и проверку выполненного ремонта.
          </p>
          {profile.role === "USER" ? (
            <div className="notice info">
              <Building2 size={18} /> Муниципальные действия доступны после
              назначения роли администратором.
            </div>
          ) : (
            <Link className="button primary" href="/">
              Открыть рабочее пространство <ArrowRight size={16} />
            </Link>
          )}
          <Link className="text-link" href="/system">
            Как работает KEPIL <ArrowRight size={15} />
          </Link>
        </section>
      </div>
    </>
  );
}
