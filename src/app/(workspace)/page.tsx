import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Plus,
  ShieldCheck,
  ClipboardList,
  Clock3,
  RotateCcw,
  ArrowRight,
  CircleCheck,
  Activity,
} from "lucide-react";
import { getDataset } from "@/lib/data";
import { PageHeader, TextLink, Empty } from "@/components/ui";
import { ClaimsTable } from "@/components/tables";
import { statuses, date, auditNames } from "@/lib/labels";
export default async function Dashboard() {
  const d = await getDataset();
  if (d.profile.role === "CONTRACTOR") redirect("/contractor");
  const active = d.warranties.filter(
    (w) => w.computed_status === "ACTIVE",
  ).length;
  const open = d.claims.filter((c) => c.status !== "VERIFIED");
  const overdue = open.filter((c) => c.sla_status === "OVERDUE");
  const repeats = d.defects.filter((x) => x.repeat_defect);
  const finished = d.claims.filter(
    (c) => c.status === "VERIFIED" && c.completed_at,
  );
  const avg = finished.length
    ? (
        finished.reduce(
          (sum, c) =>
            sum +
            (Date.parse(c.completed_at!) - Date.parse(c.created_at)) / 86400000,
          0,
        ) / finished.length
      ).toFixed(1)
    : null;
  const attention = [...open]
    .sort(
      (a, b) =>
        Number(b.sla_status === "OVERDUE") -
          Number(a.sla_status === "OVERDUE") ||
        a.repair_deadline.localeCompare(b.repair_deadline),
    )
    .slice(0, 5);
  const metrics = [
    {
      label: "Активные гарантии",
      value: active,
      note: `${d.assets.length} объектов в реестре`,
      icon: ShieldCheck,
      tone: "teal",
      href: "/assets",
    },
    {
      label: "Открытые заявки",
      value: open.length,
      note: "На всех этапах до приёмки",
      icon: ClipboardList,
      tone: "blue",
      href: "/claims",
    },
    {
      label: "Просроченные",
      value: overdue.length,
      note: "Требуют внимания службы",
      icon: Clock3,
      tone: "red",
      href: "/claims",
    },
    {
      label: "Повторные дефекты",
      value: repeats.length,
      note: "Совпадения в окне 90 дней",
      icon: RotateCcw,
      tone: "amber",
      href: "/assets",
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="ОПЕРАТИВНАЯ СВОДКА"
        title="Город под контролем"
        description="Гарантии, обязательства подрядчиков и качество выполненных работ."
        action={
          <Link className="button primary" href="/defects/new">
            <Plus size={18} />
            Зарегистрировать дефект
          </Link>
        }
      />
      <div className="overview-strip">
        <span>
          <span className="live-dot" />
          Сводка на {date(d.today)}
        </span>
        <span>Актау, Мангистауская область</span>
        <span>Источник: база KEPIL</span>
      </div>
      <div className="metrics">
        {metrics.map(({ label, value, note, icon: Icon, tone, href }) => (
          <Link key={label} href={href} className={`metric metric-${tone}`}>
            <div className="metric-label">
              {label}
              <Icon size={18} />
            </div>
            <strong>{value.toString().padStart(2, "0")}</strong>
            <span>
              {note}
              <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel table-panel attention-panel">
          <div className="panel-title">
            <div>
              <h2>Требуют внимания</h2>
              <p>Сначала просрочки, затем ближайшие сроки</p>
            </div>
            <TextLink href="/claims">Все заявки</TextLink>
          </div>
          <ClaimsTable claims={attention} compact />
        </section>
        <section className="panel status-chart">
          <div className="panel-title">
            <h2>Заявки по статусам</h2>
            <span className="small muted">Всего {d.claims.length}</span>
          </div>
          <div
            className="bar-chart"
            role="img"
            aria-label={`Распределение ${d.claims.length} заявок по статусам`}
          >
            {[
              "OPEN",
              "ACKNOWLEDGED",
              "IN_PROGRESS",
              "REPAIR_SUBMITTED",
              "REJECTED",
              "VERIFIED",
            ].map((s) => {
              const count = d.claims.filter((c) => c.status === s).length;
              return (
                <div className="bar-row" key={s}>
                  <div>
                    <span>{statuses[s]}</span>
                    <strong>{count}</strong>
                  </div>
                  <div className="bar-track">
                    <span
                      className={`bar-${s.toLowerCase()}`}
                      style={{
                        width: `${d.claims.length ? (count / d.claims.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="chart-foot">
            <CircleCheck size={19} />
            <div>
              <strong>{finished.length} ремонтов принято</strong>
              <span>
                {avg
                  ? `Среднее время ремонта: ${avg} дн.`
                  : "Среднее время появится после первого ремонта"}
              </span>
            </div>
          </div>
        </section>
        <section className="panel activity-panel">
          <div className="panel-title">
            <h2>
              <Activity size={18} />
              Последние события
            </h2>
            <span className="small muted">Журнал ответственности</span>
          </div>
          {d.audit.length ? (
            <div className="activity-list">
              {d.audit.slice(0, 5).map((e) => (
                <div key={e.id}>
                  <span
                    className={`activity-icon ${e.action === "VERIFICATION_APPROVED" ? "positive" : ""}`}
                  >
                    <CircleCheck size={16} />
                  </span>
                  <div>
                    <strong>{auditNames[e.action] ?? e.action}</strong>
                    <p>
                      {e.actor_name}
                      {e.entity_type === "claim" && (
                        <>
                          {" "}
                          ·{" "}
                          <Link href={`/claims/${e.entity_id}`}>
                            Открыть заявку
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <time>{date(e.created_at, true)}</time>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </section>
        <section className="panel contractor-summary">
          <div className="panel-title">
            <h2>Обязательства подрядчиков</h2>
          </div>
          {d.contractors.map((k) => {
            const own = d.claims.filter((c) => c.contractor_id === k.id);
            const pending = own.filter((c) => c.status !== "VERIFIED");
            return (
              <div className="contractor-row" key={k.id}>
                <span className="company-monogram">
                  {k.name
                    .replace(/ТОО|«|»|Демо/g, "")
                    .trim()
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <div>
                  <strong>{k.name}</strong>
                  <span>
                    {own.filter((c) => c.status === "VERIFIED").length} принято
                    · {pending.filter((c) => c.sla_status === "OVERDUE").length}{" "}
                    просрочено
                  </span>
                </div>
                <b>
                  {pending.length}
                  <small>в работе</small>
                </b>
              </div>
            );
          })}
        </section>
      </div>
      <div className="workflow-ribbon">
        <ShieldCheck size={21} />
        <strong>От дефекта до подтверждённого ремонта</strong>
        <span>
          Гарантия
          <ArrowRight size={13} />
          Подрядчик
          <ArrowRight size={13} />
          Ремонт
          <ArrowRight size={13} />
          Приёмка
        </span>
        <Link href="/system">
          Как это работает
          <ArrowUpRightIcon />
        </Link>
      </div>
    </>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={15} />;
}
