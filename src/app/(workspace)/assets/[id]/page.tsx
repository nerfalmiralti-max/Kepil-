import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, ArrowLeft, MapPin, FileText, RotateCcw } from "lucide-react";
import { getDataset } from "@/lib/data";
import {
  PageHeader,
  WarrantyCard,
  AuditTrail,
  Badge,
  Empty,
} from "@/components/ui";
import { ClaimsTable } from "@/components/tables";
import { date, assetTypes, categories } from "@/lib/labels";
export default async function AssetDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await getDataset();
  const a = d.assets.find((a) => a.id === id);
  if (!a) notFound();
  const contract = d.contracts.find((c) => c.id === a.contract_id);
  const contractor = d.contractors.find(
    (k) => k.id === contract?.contractor_id,
  );
  const warranty = d.warranties
    .filter((w) => w.asset_id === id)
    .sort(
      (x, y) =>
        Number(y.computed_status === "ACTIVE") -
          Number(x.computed_status === "ACTIVE") ||
        y.expires_at.localeCompare(x.expires_at),
    )[0];
  const defects = d.defects.filter((x) => x.asset_id === id);
  const claims = d.claims.filter((c) => c.asset_id === id);
  const ids = new Set([
    id,
    ...defects.map((x) => x.id),
    ...claims.map((c) => c.id),
    ...d.warranties.filter((w) => w.asset_id === id).map((w) => w.id),
  ]);
  return (
    <>
      <Link className="back-link" href="/assets">
        <ArrowLeft size={15} />
        Реестр объектов
      </Link>
      <PageHeader
        eyebrow={`${a.asset_code} · ${assetTypes[a.asset_type]}`}
        title={a.name}
        description={`${a.microdistrict} микрорайон · ${a.address}`}
        action={
          d.profile.role !== "CONTRACTOR" ? (
            <Link className="button primary" href={`/defects/new?asset=${id}`}>
              <Plus size={17} />
              Сообщить о дефекте
            </Link>
          ) : undefined
        }
      />
      <div className="detail-grid asset-detail-grid">
        <div className="stack">
          <section className="panel">
            <div className="panel-title">
              <h2>
                <MapPin size={18} />
                Паспорт объекта
              </h2>
              {d.profile.role === "ADMIN" && (
                <Link
                  className="text-link"
                  href={`/registry?tab=assets&edit=${id}`}
                >
                  Изменить
                </Link>
              )}
            </div>
            <dl className="details-list">
              <div>
                <dt>Инвентарный код</dt>
                <dd className="code">{a.asset_code}</dd>
              </div>
              <div>
                <dt>Тип инфраструктуры</dt>
                <dd>{assetTypes[a.asset_type]}</dd>
              </div>
              <div>
                <dt>Место расположения</dt>
                <dd>{a.address}</dd>
              </div>
              <div>
                <dt>Введён в эксплуатацию</dt>
                <dd>{date(a.commissioned_at)}</dd>
              </div>
              {a.latitude && a.longitude && (
                <div>
                  <dt>Координаты</dt>
                  <dd>
                    {a.latitude}, {a.longitude}
                  </dd>
                </div>
              )}
            </dl>
            {a.description && (
              <p className="description-text">{a.description}</p>
            )}
          </section>
          <section className="panel">
            <div className="panel-title">
              <h2>
                <FileText size={18} />
                Основание гарантии
              </h2>
            </div>
            <dl className="details-list">
              <div>
                <dt>Договор</dt>
                <dd>{contract?.contract_number}</dd>
              </div>
              <div>
                <dt>Предмет</dt>
                <dd>{contract?.title}</dd>
              </div>
              <div>
                <dt>Подрядчик</dt>
                <dd>{contractor?.name}</dd>
              </div>
              <div>
                <dt>Контакт</dt>
                <dd>
                  {contractor?.contact_name} {contractor?.contact_phone}
                </dd>
              </div>
            </dl>
          </section>
        </div>
        <div className="stack">
          <WarrantyCard
            warranty={warranty}
            today={d.today}
            contractor={contractor?.name}
          />
          {defects.some((x) => x.repeat_defect) && (
            <div className="notice warning">
              <RotateCcw size={22} />
              <div>
                <strong>Зафиксированы повторные дефекты</strong>
                <p>
                  Изучите историю объекта перед приёмкой следующего ремонта.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <section className="panel table-panel">
        <div className="panel-title">
          <h2>Гарантийные заявки</h2>
          <span className="small muted">{claims.length} заявок</span>
        </div>
        <ClaimsTable claims={claims} compact />
      </section>
      <section className="panel">
        <div className="panel-title">
          <h2>История дефектов</h2>
        </div>
        {defects.length ? (
          <div className="defect-list">
            {defects.map((x) => (
              <div key={x.id}>
                <div>
                  <strong>{x.title}</strong>
                  <p>
                    {categories[x.category]} · {date(x.reported_at, true)}
                  </p>
                  <p>{x.description}</p>
                </div>
                <div>
                  {x.repeat_defect && <Badge value="REPEAT" />}
                  <Badge value={x.severity} />
                  {!claims.some((c) => c.defect_id === x.id) && (
                    <span className="cell-sub">Без гарантийной заявки</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="Дефекты не зарегистрированы" />
        )}
      </section>
      <AuditTrail events={d.audit.filter((e) => ids.has(e.entity_id))} />
    </>
  );
}
