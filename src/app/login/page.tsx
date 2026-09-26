import { redirect } from "next/navigation";
import { configured, createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth-forms";
import { getProfile } from "@/lib/data";
import { defaultWorkspace } from "@/lib/auth-routing";
export const dynamic = "force-dynamic";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!configured()) redirect("/setup");
  const params = await searchParams;
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (user && params.error !== "profile") {
    const profile = await getProfile();
    redirect(defaultWorkspace(profile.role));
  }
  return (
    <div className="login-page">
      <section className="login-story">
        <div className="login-story-top">
          <strong>KEPIL</strong>
          <span>ГОРОД НА ГАРАНТИИ</span>
        </div>
        <div className="login-headline">
          <div className="login-region">АКТАУ · МАНГИСТАУСКАЯ ОБЛАСТЬ</div>
          <h1>Контроль гарантий городской инфраструктуры</h1>
          <p>Объекты, сроки и ответственные — в одной проверяемой истории.</p>
          <ol className="login-process" aria-label="Порядок работы">
            <li>Дефект</li>
            <li>Гарантия</li>
            <li>Подрядчик</li>
            <li>Проверка</li>
          </ol>
        </div>
        <div className="login-demo">
          <span>ДЕМОНСТРАЦИОННЫЙ ПРОЕКТ</span>
          <span>Данные не являются официальными</span>
        </div>
      </section>
      <section className="login-form-area">
        <div className="login-form-card">
          <div className="login-form-kicker">ЛИЧНЫЙ ДОСТУП</div>
          <h2>Вход в KEPIL</h2>
          <p className="login-form-intro">
            Войдите с паролем KEPIL или создайте новый аккаунт с адресом Gmail.
          </p>
          {params.error === "profile" && (
            <div className="notice danger">
              Не удалось создать профиль. Повторите вход; если ошибка
              сохранится, обратитесь к администратору KEPIL.
            </div>
          )}
          {params.error === "google" && (
            <div className="notice danger" role="alert">
              Вход через Google не завершён. Попробуйте ещё раз или войдите по
              email.
            </div>
          )}
          {params.error === "cancelled" && (
            <div className="notice info" role="status">
              Вход через Google был отменён. Вы можете попробовать ещё раз.
            </div>
          )}
          {params.error === "callback" && (
            <div className="notice danger" role="alert">
              Не удалось подтвердить вход. Повторите попытку.
            </div>
          )}
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
