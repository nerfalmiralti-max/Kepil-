"use client";
import Link from "next/link";
import { useState } from "react";
import { Search, ArrowUpDown, ArrowUpRight } from "lucide-react";
import type { Asset, Claim, Contract, Contractor, Warranty } from "@/lib/types";
import { assetTypes, claimCode, date, statuses } from "@/lib/labels";
import { Badge, Empty } from "./ui";

export function ClaimsTable({
  claims,
  compact = false,
}: {
  claims: Claim[];
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sla, setSla] = useState("");
  const [sort, setSort] = useState<"new" | "due">("new");
  const filtered = claims
    .filter(
      (c) =>
        (!status || c.status === status) &&
        (!sla || c.sla_status === sla) &&
        `${claimCode(c.claim_number)} ${c.asset_name} ${c.contractor_name} ${c.title}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      compact
        ? 0
        : sort === "new"
          ? b.created_at.localeCompare(a.created_at)
          : (a.status === "OPEN"
              ? a.response_deadline
              : a.repair_deadline
            ).localeCompare(
              b.status === "OPEN" ? b.response_deadline : b.repair_deadline,
            ),
    );
  return (
    <div className="table-section">
      {!compact && (
        <div className="filters">
          <label className="search-input">
            <Search size={17} />
            <input
              aria-label="Поиск заявок"
              placeholder="Номер, объект или подрядчик"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="Статус заявки"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Все статусы</option>
            {[
              "OPEN",
              "ACKNOWLEDGED",
              "IN_PROGRESS",
              "REPAIR_SUBMITTED",
              "REJECTED",
              "VERIFIED",
            ].map((s) => (
              <option key={s} value={s}>
                {statuses[s]}
              </option>
            ))}
          </select>
          <select
            aria-label="Срок заявки"
            value={sla}
            onChange={(e) => setSla(e.target.value)}
          >
            <option value="">Все сроки</option>
            {["OVERDUE", "DUE_SOON", "ON_TIME", "COMPLETED"].map((s) => (
              <option key={s} value={s}>
                {statuses[s]}
              </option>
            ))}
          </select>
          <button
            className="button quiet"
            onClick={() => setSort(sort === "new" ? "due" : "new")}
          >
            <ArrowUpDown size={15} />
            {sort === "new" ? "Сначала новые" : "По сроку"}
          </button>
        </div>
      )}
      {filtered.length === 0 ? (
        <Empty title="Заявок по этим условиям нет">
          Измените фильтры или зарегистрируйте новый дефект.
        </Empty>
      ) : (
        <div
          className="table-scroll"
          role="region"
          aria-label="Список гарантийных заявок"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th>Заявка / объект</th>
                {!compact && <th>Подрядчик</th>}
                <th>Статус</th>
                <th>Ближайший срок</th>
                <th>
                  <span className="sr-only">Открыть</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link className="row-title" href={`/claims/${c.id}`}>
                      <span className="code">{claimCode(c.claim_number)}</span>
                      {c.asset_name}
                    </Link>
                    <span className="cell-sub">
                      {c.title}
                      {c.repeat_defect && (
                        <span className="repeat-inline"> · Повторный</span>
                      )}
                    </span>
                  </td>
                  {!compact && (
                    <td>
                      <span className="contractor-cell">
                        {c.contractor_name}
                      </span>
                      <span className="cell-sub">
                        {c.microdistrict} микрорайон
                      </span>
                    </td>
                  )}
                  <td>
                    <Badge value={c.status} />
                  </td>
                  <td>
                    <div className="deadline-cell">
                      <span>
                        {date(
                          c.status === "OPEN"
                            ? c.response_deadline
                            : c.repair_deadline,
                          true,
                        )}
                      </span>
                      <Badge value={c.sla_status} />
                    </div>
                  </td>
                  <td>
                    <Link
                      className="icon-link"
                      aria-label={`Открыть ${claimCode(c.claim_number)}`}
                      href={`/claims/${c.id}`}
                    >
                      <ArrowUpRight size={17} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!compact && (
        <div className="table-footer">
          Показано {filtered.length} из {claims.length} заявок
          <span>Сроки рассчитаны сервером</span>
        </div>
      )}
    </div>
  );
}
export function AssetsTable({
  assets,
  warranties,
  contractors,
  contracts,
}: {
  assets: Asset[];
  warranties: Warranty[];
  contractors: Contractor[];
  contracts: Contract[];
  today: string;
}) {
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("");
  const [type, setType] = useState("");
  const [contractor, setContractor] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState(false);
  const rows = assets
    .map((a) => {
      const w = warranties
        .filter((w) => w.asset_id === a.id)
        .sort(
          (x, y) =>
            Number(y.computed_status === "ACTIVE") -
              Number(x.computed_status === "ACTIVE") ||
            y.expires_at.localeCompare(x.expires_at),
        )[0];
      const k = contractors.find(
        (k) =>
          k.id === contracts.find((c) => c.id === a.contract_id)?.contractor_id,
      );
      return {
        a,
        w,
        k,
        state: w?.computed_status ?? "NOT_FOUND",
      };
    })
    .filter(
      ({ a, k, state }) =>
        (!district || a.microdistrict === district) &&
        (!type || a.asset_type === type) &&
        (!contractor || k?.id === contractor) &&
        (!status || state === status) &&
        `${a.name} ${a.asset_code} ${a.address}`
          .toLowerCase()
          .includes(q.toLowerCase()),
    )
    .sort((a, b) =>
      sort
        ? a.a.name.localeCompare(b.a.name, "ru")
        : a.a.asset_code.localeCompare(b.a.asset_code),
    );
  return (
    <div className="panel table-panel">
      <div className="filters">
        <label className="search-input">
          <Search size={17} />
          <input
            aria-label="Поиск объектов"
            placeholder="Название, код или адрес"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <select
          aria-label="Микрорайон"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
        >
          <option value="">Все микрорайоны</option>
          {[...new Set(assets.map((a) => a.microdistrict))]
            .sort((a, b) => Number(a) - Number(b))
            .map((d) => (
              <option key={d} value={d}>
                {d} микрорайон
              </option>
            ))}
        </select>
        <select
          aria-label="Тип объекта"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Все типы</option>
          {Object.entries(assetTypes).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          aria-label="Подрядчик"
          value={contractor}
          onChange={(e) => setContractor(e.target.value)}
        >
          <option value="">Все подрядчики</option>
          {contractors.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Гарантия"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Любая гарантия</option>
          {["ACTIVE", "EXPIRED", "NOT_FOUND", "SCHEDULED"].map((v) => (
            <option key={v} value={v}>
              {statuses[v]}
            </option>
          ))}
        </select>
      </div>
      {!rows.length ? (
        <Empty title="Объекты не найдены">
          Попробуйте другие параметры поиска.
        </Empty>
      ) : (
        <div
          className="table-scroll"
          role="region"
          aria-label="Реестр объектов"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th>
                  <button className="table-sort" onClick={() => setSort(!sort)}>
                    Объект
                    <ArrowUpDown size={13} />
                  </button>
                </th>
                <th>Микрорайон / тип</th>
                <th>Подрядчик</th>
                <th>Гарантия</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ a, w, k, state }) => (
                <tr key={a.id}>
                  <td>
                    <Link className="row-title" href={`/assets/${a.id}`}>
                      <span className="code">{a.asset_code}</span>
                      {a.name}
                    </Link>
                    <span className="cell-sub">{a.address}</span>
                  </td>
                  <td>
                    {a.microdistrict} микрорайон
                    <span className="cell-sub">{assetTypes[a.asset_type]}</span>
                  </td>
                  <td>{k?.name ?? "—"}</td>
                  <td>
                    <Badge value={state} />
                    <span className="cell-sub">
                      {w ? `До ${date(w.expires_at)}` : "Не зарегистрирована"}
                    </span>
                  </td>
                  <td>
                    <Link
                      className="icon-link"
                      aria-label={`Открыть ${a.name}`}
                      href={`/assets/${a.id}`}
                    >
                      <ArrowUpRight size={17} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="table-footer">
        Показано {rows.length} из {assets.length} объектов
        <span>Актау · Демонстрационный реестр</span>
      </div>
    </div>
  );
}
