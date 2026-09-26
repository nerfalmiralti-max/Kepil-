import Link from "next/link";
import { PasswordResetRequestForm } from "@/components/auth-forms";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="auth-subpage">
      <div className="auth-subpage-card">
        <Link className="auth-subpage-brand" href="/login">
          KEPIL <span>ГОРОД НА ГАРАНТИИ</span>
        </Link>
        <div className="login-form-kicker">ВОССТАНОВЛЕНИЕ ДОСТУПА</div>
        <h1>Забыли пароль?</h1>
        <p>
          Укажите email аккаунта. Мы отправим ссылку для смены пароля KEPIL.
        </p>
        {error === "link" && (
          <p className="auth-feedback error" role="alert">
            Ссылка недействительна или устарела. Запросите новую.
          </p>
        )}
        <PasswordResetRequestForm />
        <Link className="auth-back-link" href="/login">
          Вернуться ко входу
        </Link>
      </div>
    </main>
  );
}
