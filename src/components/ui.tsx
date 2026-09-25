import Link from "next/link";
import {
  ArrowUpRight,
  CircleCheck,
  CircleAlert,
  Clock3,
  ShieldCheck,
  Minus,
  RotateCcw,
} from "lucide-react";
import { date, statuses } from "@/lib/labels";
import type { Warranty, History, Audit } from "@/lib/types";
import { auditNames } from "@/lib/labels";

export function Badge({ value }: { value: string }) {
  const positive = ["ACTIVE", "VERIFIED", "COMPLETED", "APPROVED"].includes(
    value,
  );
  const negative = ["OVERDUE", "EXPIRED", "CRITICAL", "REJECTED"].includes(
    value,
  );
  const warning = ["DUE_SOON", "HIGH", "REPAIR_SUBMITTED", "REPEAT"].includes(
    value,
  );
  const Icon = positive
    ? CircleCheck
    : negative
      ? CircleAlert
      : warning
        ? Clock3
        : value === "IN_PROGRESS"
          ? RotateCcw
          : Minus;
  return (
    <span
      className={`badge ${positive ? "positive" : negative ? "negative" : warning ? "warning" : "neutral"}`}
    >
      <Icon size={13} aria-hidden="true" />
      {statuses[value] ?? (value === "REPEAT" ? "Повторный дефект" : value)}
    </span>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Empty({
  title = "Записей пока нет",
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <ShieldCheck size={30} strokeWidth={1.3} />
      <h3>{title}</h3>
      <p>{children ?? "Новые записи появятся здесь после регистрации."}</p>
    </div>
  );
}
export function TextLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link className="text-link" href={href}>
      {children}
      <ArrowUpRight size={15} />
    </Link>
  );
}
export function WarrantyCard({
  warranty,
  contractor,
}: {
  warranty?: Warranty;
  today: string;
  contractor?: string;
}) {
  if (!warranty)
    return (
      <section className="panel warranty-panel">
        <div className="panel-title">
          <h2>Гарантия</h2>
          <Badge value="NOT_FOUND" />
        </div>
        <p className="muted">
          Для объекта нет зарегистрированной гарантии. Дефект будет сохранён без
          автоматической заявки.
        </p>
      </section>
    );
  const state = warranty.computed_status;
  const remaining = warranty.remaining_days;
  const elapsed = warranty.elapsed_percent;
  return (
    <section className="panel warranty-panel">
      <div className="panel-title">
        <h2>
          <ShieldCheck size={18} />
          Гарантийные обязательства
        </h2>
        <Badge value={state} />
      </div>
      <div className="warranty-days">
        {state === "ACTIVE" ? (
          <>
            <strong>{remaining}</strong>
            <span>дней до окончания гарантии</span>
          </>
        ) : (
          <strong className="smaller">{statuses[state]}</strong>
        )}
      </div>
      <div
        className="warranty-track"
        role="img"
        aria-label={`Гарантия с ${date(warranty.starts_at)} до ${date(warranty.expires_at)}. Осталось ${remaining} дней.`}
      >
        <div style={{ width: `${elapsed}%` }} />
        <span style={{ left: `${elapsed}%` }} />
      </div>
      <div className="spread small muted">
        <span>{date(warranty.starts_at)}</span>
        <span>{date(warranty.expires_at)}</span>
      </div>
      <div className="warranty-contractor">
        <span className="small muted">Ответственный подрядчик</span>
        <strong>{contractor ?? "—"}</strong>
      </div>
      <p className="small muted">{warranty.terms}</p>
    </section>
  );
}
export function Timeline({ history }: { history: History[] }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <h2>История ответственности</h2>
        <span className="small muted">{history.length} событий</span>
      </div>
      {history.length === 0 ? (
        <Empty />
      ) : (
        <ol className="timeline">
          {[...history]
            .sort((a, b) => a.created_at.localeCompare(b.created_at))
            .map((h, i) => (
              <li key={h.id}>
                <span
                  className={`timeline-dot ${i === history.length - 1 ? "current" : ""}`}
                />
                <div className="spread">
                  <strong>
                    {statuses[h.to_status] ??
                      (h.to_status === "REPORTED"
                        ? "Дефект зарегистрирован"
                        : h.to_status)}
                  </strong>
                  <time>{date(h.created_at, true)}</time>
                </div>
                <p>{h.actor_name}</p>
                {h.reason && <div className="timeline-note">{h.reason}</div>}
              </li>
            ))}
        </ol>
      )}
    </section>
  );
}
export function AuditTrail({ events }: { events: Audit[] }) {
  return (
    <details className="panel audit">
      <summary>
        Журнал аудита <span>{events.length} записей</span>
      </summary>
      <div className="audit-list">
        {events.map((e) => (
          <div key={e.id}>
            <strong>{auditNames[e.action] ?? e.action}</strong>
            <span>
              {e.actor_name} · {date(e.created_at, true)}
            </span>
            <code>
              {e.action} · {e.id.slice(0, 8)}
            </code>
          </div>
        ))}
      </div>
    </details>
  );
}
