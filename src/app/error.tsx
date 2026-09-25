"use client";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="error-state">
      <AlertTriangle size={34} />
      <h1>Не удалось загрузить данные</h1>
      <p>
        Проверьте соединение и доступность Supabase. Повторная попытка не
        создаст повторных записей.
      </p>
      <div className="button-row">
        <button className="button primary" onClick={reset}>
          Повторить попытку
        </button>
        <Link className="button secondary" href="/login">
          К странице входа
        </Link>
      </div>
    </div>
  );
}
