import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, Database, KeyRound, Rocket } from "lucide-react";
import { configured } from "@/lib/supabase/server";
export default function SetupPage() {
  if (configured()) redirect("/login");
  return (
    <main className="setup-page">
      <div className="setup-card">
        <div className="brand dark">
          <span className="brand-mark">
            <ShieldCheck size={25} />
          </span>
          <span>
            KEPIL<small>ГОРОД НА ГАРАНТИИ</small>
          </span>
        </div>
        <div className="eyebrow">НАСТРОЙКА ПРОЕКТА</div>
        <h1>Подключите рабочую базу</h1>
        <p className="muted">
          Интерфейс и серверные правила готовы к подключению. Для входа и работы
          с заявками необходим проект Supabase.
        </p>
        <div className="notice warning">
          База данных пока не настроена. Данные и успешные операции здесь не
          имитируются.
        </div>
        <ol className="setup-steps">
          <li>
            <Database size={23} />
            <div>
              <strong>Создайте Supabase и примените миграцию</strong>
              <p>
                SQL находится в <code>supabase/migrations/</code>. Он создаёт
                таблицы, политики доступа и бизнес-правила.
              </p>
            </div>
          </li>
          <li>
            <KeyRound size={23} />
            <div>
              <strong>Укажите параметры подключения</strong>
              <p>
                <code>NEXT_PUBLIC_SUPABASE_URL</code>
                <br />
                <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>
              </p>
            </div>
          </li>
          <li>
            <Rocket size={23} />
            <div>
              <strong>Создайте демонстрационные учётные записи</strong>
              <p>
                Настройте серверный ключ и пароль в <code>.env.local</code>,
                затем выполните <code>npm run seed</code>. Перезапустите
                приложение.
              </p>
            </div>
          </li>
        </ol>
        <p className="small muted">
          Полные инструкции, переменные окружения и сценарий проверки — в
          README.md проекта.
        </p>
        <Link href="/" className="button primary">
          Проверить подключение
        </Link>
      </div>
    </main>
  );
}
