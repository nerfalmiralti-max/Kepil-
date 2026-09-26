import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileImage,
  Clock3,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { getDataset, getEvidence } from "@/lib/data";
import {
  PageHeader,
  Badge,
  WarrantyCard,
  Timeline,
  AuditTrail,
  Empty,
} from "@/components/ui";
import { ClaimActions, UploadForm } from "@/components/forms";
import { claimCode, date, categories } from "@/lib/labels";
export default async function ClaimDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await getDataset();
  const c = d.claims.find((c) => c.id === id);
  if (!c) notFound();
  const defect = d.defects.find((x) => x.id === c.defect_id)!;
  const warranty = d.warranties.find((w) => w.id === c.warranty_id);
  const evidence = await getEvidence(id);
  const history = d.history.filter(
    (h) => h.entity_id === id || h.entity_id === defect.id,
  );
  const events = d.audit.filter(
    (e) => e.entity_id === id || e.entity_id === defect.id,
  );
  const previousDefect = d.defects
    .filter((item) => defect.previous_defect_ids.includes(item.id))
    .sort((a, b) => b.reported_at.localeCompare(a.reported_at))[0];
  const deadline =
    c.status === "OPEN" ? c.response_deadline : c.repair_deadline;
  const hours = Math.ceil(
    (Date.parse(deadline) - (await currentTimestamp())) / 3600000,
  );
  const slaTitle =
    c.status === "VERIFIED"
      ? "Ремонт подтверждён"
      : c.status === "REPAIR_SUBMITTED"
        ? "Ожидает решения инспектора"
        : c.sla_status === "OVERDUE"
          ? `Просрочено на ${Math.max(1, Math.ceil(-hours / 24))} дн.`
          : hours <= 48
            ? `Осталось ${Math.max(0, hours)} ч.`
            : `Осталось ${Math.ceil(hours / 24)} дн.`;
  return (
    <>
      <Link
        className="back-link"
        href={d.profile.role === "CONTRACTOR" ? "/contractor" : "/claims"}
      >
        <ArrowLeft size={15} />К списку заявок
      </Link>
      <PageHeader
        eyebrow={`${claimCode(c.claim_number)} · ${date(c.created_at)}`}
        title={c.title}
        description={c.asset_name}
        action={
          <div className="button-row">
            <Badge value={c.status} />
          </div>
        }
      />
      <section
        className={`sla-hero ${c.sla_status === "OVERDUE" ? "is-overdue" : c.sla_status === "DUE_SOON" ? "is-soon" : ""}`}
        aria-label="Контроль срока заявки"
      >
        <div>
          <span className="eyebrow">КОНТРОЛЬ СРОКА</span>
          <strong>{slaTitle}</strong>
          <span>
            {c.status === "REPAIR_SUBMITTED"
              ? "Срок ремонта приостановлен на время проверки"
              : c.status === "VERIFIED"
                ? "Результат сохранён в истории заявки"
                : `Ближайший срок · ${date(deadline, true)}`}
          </span>
        </div>
      </section>
      <div className="claim-milestones">
        {[
          "Зарегистрирована",
          "Принята",
          "В работе",
          "На проверке",
          "Подтверждена",
        ].map((label, i) => {
          const stage = [
            "OPEN",
            "ACKNOWLEDGED",
            "IN_PROGRESS",
            "REPAIR_SUBMITTED",
            "VERIFIED",
          ].indexOf(c.status === "REJECTED" ? "IN_PROGRESS" : c.status);
          return (
            <div key={label} className={i <= stage ? "reached" : ""}>
              <span>{i + 1}</span>
              {label}
            </div>
          );
        })}
      </div>
      {defect.repeat_defect && (
        <div className="notice warning repeat-alert">
          <RotateCcw size={22} />
          <div>
            <strong>
              Повторный дефект · {defect.repeat_count}-й случай за 90 дней
            </strong>
            <p>
              Ранее на этом объекте уже регистрировалась категория «
              {categories[defect.category]}».
            </p>
            {previousDefect && (
              <p className="repeat-previous">
                Предыдущий случай: {date(previousDefect.reported_at, true)} ·{" "}
                {previousDefect.title}
              </p>
            )}
            <Link href={`/assets/${c.asset_id}`} className="text-link">
              Посмотреть предыдущие дефекты
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      )}
      <div className="detail-grid">
        <div className="stack">
          <section className="panel">
            <div className="panel-title">
              <h2>Дефект и ответственность</h2>
              <Badge value={defect.severity} />
            </div>
            <p className="description-text">{defect.description}</p>
            <dl className="details-list">
              <div>
                <dt>Объект</dt>
                <dd>
                  <Link href={`/assets/${c.asset_id}`}>
                    {c.asset_code} · {c.asset_name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Категория</dt>
                <dd>{categories[defect.category]}</dd>
              </div>
              <div>
                <dt>Ответственный подрядчик</dt>
                <dd>{c.contractor_name}</dd>
              </div>
              <div>
                <dt>Обнаружен</dt>
                <dd>{date(defect.reported_at, true)}</dd>
              </div>
            </dl>
          </section>
          <ClaimActions key={c.status} claim={c} role={d.profile.role} />
          <section className="panel">
            <div className="panel-title">
              <h2>
                <FileImage size={18} />
                Подтверждения ремонта
              </h2>
              <span className="small muted">{evidence.length} файлов</span>
            </div>
            {evidence.length ? (
              <div className="evidence-grid">
                {evidence.map((e) => (
                  <figure key={e.id}>
                    {e.url ? (
                      <a href={e.url} target="_blank" rel="noreferrer">
                        <Image
                          unoptimized
                          width={600}
                          height={400}
                          src={e.url}
                          alt={`${e.evidence_type === "BEFORE" ? "До" : "После"} ремонта: ${e.note || c.title}`}
                          loading="lazy"
                        />
                      </a>
                    ) : (
                      <div className="image-unavailable">
                        Фото недоступно. Обновите страницу.
                      </div>
                    )}
                    <figcaption>
                      <strong>
                        {e.evidence_type === "BEFORE"
                          ? "До ремонта"
                          : "После ремонта"}
                      </strong>
                      <p>{e.note}</p>
                      <time>{date(e.created_at, true)}</time>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <Empty title="Фотографии ещё не добавлены">
                Подрядчик должен приложить фото результата перед отправкой на
                проверку.
              </Empty>
            )}
            {d.profile.role !== "INSPECTOR" &&
              ["ACKNOWLEDGED", "IN_PROGRESS", "REJECTED"].includes(
                c.status,
              ) && <UploadForm claimId={id} />}
          </section>
          <Timeline history={history} />
        </div>
        <div className="stack">
          <section className="panel deadline-panel">
            <div className="panel-title">
              <h2>
                <Clock3 size={18} />
                Контроль сроков
              </h2>
            </div>
            <dl className="details-list vertical">
              <div>
                <dt>Принять заявку до</dt>
                <dd>{date(c.response_deadline, true)}</dd>
              </div>
              <div>
                <dt>Завершить ремонт до</dt>
                <dd>{date(c.repair_deadline, true)}</dd>
              </div>
              {c.completed_at && (
                <div>
                  <dt>Ремонт отправлен на проверку</dt>
                  <dd>{date(c.completed_at, true)}</dd>
                </div>
              )}
              {c.verified_at && (
                <div>
                  <dt>Подтверждено инспектором</dt>
                  <dd>{date(c.verified_at, true)}</dd>
                </div>
              )}
            </dl>
            <Badge value={c.sla_status} />
            <p className="small muted">
              Время Актау (UTC+5). Сроки назначены при регистрации по
              критичности дефекта. На проверке отсчёт ремонта приостановлен.
            </p>
          </section>
          <WarrantyCard
            warranty={warranty}
            today={d.today}
            contractor={c.contractor_name}
          />
        </div>
      </div>
      <AuditTrail events={events} />
    </>
  );
}

async function currentTimestamp() {
  return Date.now();
}
