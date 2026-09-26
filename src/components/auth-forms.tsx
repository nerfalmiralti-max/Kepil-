"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  updatePasswordAction,
} from "@/app/actions";
import type { ActionState } from "@/lib/types";

const initial: ActionState = {};

function AuthFeedback({ state }: { state: ActionState }) {
  if (state.error)
    return (
      <p className="auth-feedback error" role="alert">
        {state.error}
      </p>
    );
  if (state.success)
    return (
      <p className="auth-feedback success" role="status">
        {state.success}
      </p>
    );
  return null;
}

function PasswordInput({
  name,
  label,
  autoComplete,
}: {
  name: string;
  label: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-field">
      <label htmlFor={name}>{label}</label>
      <span className="auth-password-wrap">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          maxLength={256}
          required
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setVisible(!visible)}
          aria-label={
            visible
              ? `Скрыть ${label.toLowerCase()}`
              : `Показать ${label.toLowerCase()}`
          }
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </div>
  );
}

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [loginState, login, loginPending] = useActionState(
    loginAction,
    initial,
  );
  const [registerState, register, registerPending] = useActionState(
    registerAction,
    initial,
  );
  return (
    <div className="auth-form-shell">
      <div className="auth-tabs" role="tablist" aria-label="Способ входа">
        <button
          id="auth-tab-login"
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          aria-controls="auth-form-panel"
          onClick={() => setMode("login")}
        >
          Войти
        </button>
        <button
          id="auth-tab-register"
          type="button"
          role="tab"
          aria-selected={mode === "register"}
          aria-controls="auth-form-panel"
          onClick={() => setMode("register")}
        >
          Создать аккаунт
        </button>
      </div>
      <div
        id="auth-form-panel"
        role="tabpanel"
        aria-labelledby={`auth-tab-${mode}`}
      >
        {mode === "login" ? (
          <form action={login} className="auth-form">
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                autoComplete="username"
                placeholder="name@gmail.com"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                required
              />
            </label>
            <PasswordInput
              name="password"
              label="Пароль KEPIL"
              autoComplete="current-password"
            />
            <div className="auth-form-meta">
              <Link href="/forgot-password">Забыли пароль?</Link>
            </div>
            <AuthFeedback state={loginState} />
            <button className="auth-submit" disabled={loginPending}>
              {loginPending ? "Входим…" : "Войти"}
              <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form action={register} className="auth-form">
            <label className="auth-field">
              <span>Адрес Gmail</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="name@gmail.com"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                required
              />
            </label>
            <PasswordInput
              name="password"
              label="Пароль KEPIL"
              autoComplete="new-password"
            />
            <p className="auth-field-hint">
              Не менее 8 символов. Это отдельный пароль для KEPIL.
            </p>
            <PasswordInput
              name="repeat_password"
              label="Повторите пароль"
              autoComplete="new-password"
            />
            <AuthFeedback state={registerState} />
            <button className="auth-submit" disabled={registerPending}>
              {registerPending ? "Создаём аккаунт…" : "Создать аккаунт"}
              <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
      <p className="auth-privacy">Пароль KEPIL не связан с паролем Google.</p>
    </div>
  );
}

export function PasswordResetRequestForm() {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    initial,
  );
  return (
    <form action={action} className="auth-form">
      <label className="auth-field">
        <span>Email аккаунта</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="name@gmail.com"
          required
        />
      </label>
      <AuthFeedback state={state} />
      <button className="auth-submit" disabled={pending}>
        {pending ? "Отправляем…" : "Отправить ссылку"}
        <ArrowRight size={18} />
      </button>
    </form>
  );
}

export function PasswordUpdateForm() {
  const [state, action, pending] = useActionState(
    updatePasswordAction,
    initial,
  );
  return (
    <form action={action} className="auth-form">
      <PasswordInput
        name="password"
        label="Новый пароль"
        autoComplete="new-password"
      />
      <p className="auth-field-hint">Не менее 8 символов.</p>
      <PasswordInput
        name="repeat_password"
        label="Повторите пароль"
        autoComplete="new-password"
      />
      <AuthFeedback state={state} />
      <button className="auth-submit" disabled={pending}>
        {pending ? "Сохраняем…" : "Сохранить пароль"}
        <ArrowRight size={18} />
      </button>
    </form>
  );
}
