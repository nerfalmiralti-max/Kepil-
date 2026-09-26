import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getProfile } from "@/lib/data";
import { date, roleNames } from "@/lib/labels";

export default async function AccountPage() {
  const profile = await getProfile();
  return (
    <div className="member-page">
      <header className="member-heading">
        <span>ЛИЧНЫЙ ДОСТУП / KEPIL</span>
        <h1>Аккаунт</h1>
        <p>Данные профиля, доступ и безопасность.</p>
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
                Доступен раздел «Как работает KEPIL». Для работы с объектами и
                претензиями администратор должен назначить роль и организацию.
              </p>
              <ol className="member-workflow">
                <li>Объект вносят в реестр.</li>
                <li>При дефекте проверяют гарантию и создают претензию.</li>
                <li>Подрядчик ремонтирует и загружает доказательства.</li>
                <li>Инспектор проверяет результат.</li>
              </ol>
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
        <section className="member-section">
          <div className="member-section-top">
            <h2>Безопасность</h2>
          </div>
          <p className="member-security-copy">
            Пароль KEPIL можно сменить по ссылке, отправленной на ваш email.
          </p>
          <Link className="member-link" href="/forgot-password">
            Сменить пароль <ArrowUpRight size={17} />
          </Link>
        </section>
      </div>
    </div>
  );
}
