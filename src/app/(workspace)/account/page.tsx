import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getProfile } from "@/lib/data";
import { date, roleNames } from "@/lib/labels";

export default async function AccountPage() {
  const profile = await getProfile();
  const firstName = profile.full_name.split(" ")[0] || "пользователь";
  return (
    <div className="member-page">
      <header className="member-heading">
        <span>ЛИЧНЫЙ ДОСТУП / KEPIL</span>
        <h1>Добро пожаловать, {firstName}.</h1>
        <p>
          Ваш аккаунт активен. Здесь находятся данные профиля и доступные
          разделы.
        </p>
      </header>
      <div className="member-columns">
        <section className="member-section">
          <div className="member-section-top">
            <h2>Учётная запись</h2>
          </div>
          <dl className="member-details">
            <div>
              <dt>Имя</dt>
              <dd>{profile.full_name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt>Роль</dt>
              <dd>{roleNames[profile.role]}</dd>
            </div>
            <div>
              <dt>Организация</dt>
              <dd>{profile.organization_id ? "Назначена" : "Не назначена"}</dd>
            </div>
            <div>
              <dt>Создан</dt>
              <dd>{date(profile.created_at)}</dd>
            </div>
          </dl>
        </section>
        <section className="member-section">
          <div className="member-section-top">
            <h2>Доступ</h2>
          </div>
          {profile.role === "USER" ? (
            <div className="member-access-copy">
              <strong>Базовый доступ открыт</strong>
              <p>
                Вы можете просматривать информацию о KEPIL. Муниципальные
                действия появятся после назначения роли администратором.
              </p>
            </div>
          ) : (
            <div className="member-access-copy">
              <strong>Рабочее пространство доступно</strong>
              <p>
                Ваша роль определяет доступ к реестру, заявкам и проверке
                выполненных работ.
              </p>
              <Link className="member-link" href="/">
                Перейти к работе <ArrowUpRight size={17} />
              </Link>
            </div>
          )}
          <Link className="member-link" href="/system">
            Как работает KEPIL <ArrowUpRight size={17} />
          </Link>
        </section>
      </div>
    </div>
  );
}
