import { redirect } from "next/navigation";
import {
  ShieldCheck,
  ArrowRight,
  Building2,
  ClipboardCheck,
  Wrench,
} from "lucide-react";
import { configured, createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/forms";
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
  if (user && params.error !== "profile") redirect("/");
  return (
    <div className="login-page">
      <section className="login-story">
        <div className="brand">
          <span className="brand-mark">
            <ShieldCheck size={27} />
          </span>
          <span>
            KEPIL<small>ГОРОД НА ГАРАНТИИ</small>
          </span>
        </div>
        <div className="login-headline">
          <div className="eyebrow">АКТАУ · МАНГИСТАУСКАЯ ОБЛАСТЬ</div>
          <h1>
            Срок гарантии.
            <br />
            Чёткая ответственность.
            <br />
            <em>Проверенный результат.</em>
          </h1>
          <p>
            Рабочее пространство для муниципальных служб, инспекторов и
            подрядчиков.
          </p>
          <div className="login-process">
            <span>Дефект</span>
            <ArrowRight size={15} />
            <span>Гарантия</span>
            <ArrowRight size={15} />
            <span>Ремонт</span>
            <ArrowRight size={15} />
            <span>Приёмка</span>
          </div>
        </div>
        <div className="login-demo">
          Демонстрационный проект Smart City Aktau
          <br />
          <span>
            Сценарии муниципальной инфраструктуры, не официальные данные.
          </span>
        </div>
      </section>
      <section className="login-form-area">
        <div className="login-form-card">
          <div className="eyebrow">ДОБРО ПОЖАЛОВАТЬ</div>
          <h2>Вход в KEPIL</h2>
          <p className="muted">
            Продолжите работу с гарантийными обязательствами города.
          </p>
          {params.error === "profile" && (
            <div className="notice danger">
              Доступ к KEPIL для этой учётной записи ещё не назначен. Обратитесь
              к администратору организации.
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
          <div className="login-roles">
            <span>
              <Building2 size={16} />
              Муниципальная служба
            </span>
            <span>
              <ClipboardCheck size={16} />
              Инспектор
            </span>
            <span>
              <Wrench size={16} />
              Подрядчик
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
