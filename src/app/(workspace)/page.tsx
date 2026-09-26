import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ArrowRight, CircleCheck } from "lucide-react";
import { getDataset } from "@/lib/data";
import { PageHeader, TextLink, Empty } from "@/components/ui";
import { ClaimsTable } from "@/components/tables";
import { date, auditNames } from "@/lib/labels";
export default async function Dashboard() {
  const d = await getDataset();
  if (d.profile.role === "CONTRACTOR") redirect("/contractor");
  const active = d.warranties.filter(
    (w) => w.computed_status === "ACTIVE",
  ).length;
  const open = d.claims.filter((c) => c.status !== "VERIFIED");
  const overdue = open.filter((c) => c.sla_status === "OVERDUE");
  const repeats = d.defects.filter((x) => x.repeat_defect);
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
      tone: "teal",
      href: "/assets",
    },
    {
      label: "Открытые заявки",
      value: open.length,
      note: "На всех этапах до приёмки",
      tone: "blue",
      href: "/claims",
    },
    {
      label: "Просроченные",
      value: overdue.length,
      note: "Требуют внимания службы",
      tone: "red",
      href: "/claims",
    },
    {
      label: "Повторные дефекты",
      value: repeats.length,
      note: "Совпадения в окне 90 дней",
      tone: "amber",
      href: "/assets",
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="ОПЕРАТИВНАЯ СВОДКА"
        title="Обзор"
        description="Сроки гарантий и претензий по объектам Актау."
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
      </div>
      <div className="metrics">
        {metrics.map(({ label, value, note, tone, href }) => (
          <Link key={label} href={href} className={`metric metric-${tone}`}>
            <div className="metric-label">{label}</div>
            <strong>{value}</strong>
            <span>{note}</span>
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
          {attention.length ? (
            <ClaimsTable claims={attention} compact />
          ) : (
            <Empty title="Нет претензий, требующих внимания">
              Новые претензии появятся после регистрации дефекта на гарантийном
              объекте.
            </Empty>
          )}
        </section>
        <section className="panel activity-panel">
          <div className="panel-title">
            <h2>Последние события</h2>
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
        <strong>Нужна схема работы с претензией?</strong>
        <Link href="/system">
          Открыть порядок работы <ArrowRight size={14} />
        </Link>
      </div>
    </>
  );
}
