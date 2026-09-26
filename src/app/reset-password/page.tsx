import Link from "next/link";
import { redirect } from "next/navigation";
import { PasswordUpdateForm } from "@/components/auth-forms";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/forgot-password?error=link");
  return (
    <main className="auth-subpage">
      <div className="auth-subpage-card">
        <Link className="auth-subpage-brand" href="/login">
          KEPIL <span>ГОРОД НА ГАРАНТИИ</span>
        </Link>
        <div className="login-form-kicker">НОВЫЙ ПАРОЛЬ</div>
        <h1>Сменить пароль</h1>
        <p>
          Создайте новый пароль KEPIL для адреса <strong>{user.email}</strong>.
        </p>
        <PasswordUpdateForm />
      </div>
    </main>
  );
}
