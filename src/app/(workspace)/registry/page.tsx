import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getDataset } from "@/lib/data";
import { PageHeader, Empty } from "@/components/ui";
import { RegistryForm } from "@/components/forms";
import { date } from "@/lib/labels";
const tabs: Record<string, string> = {
  assets: "Объекты",
  contractors: "Подрядчики",
  contracts: "Договоры",
  warranties: "Гарантии",
};
export default async function RegistryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; edit?: string }>;
}) {
  const d = await getDataset();
  if (d.profile.role !== "ADMIN") redirect("/");
  const params = await searchParams;
  const tab =
    params.tab && tabs[params.tab]
      ? (params.tab as keyof Pick<
          typeof d,
          "assets" | "contractors" | "contracts" | "warranties"
        >)
      : "assets";
  const rows = d[tab];
  const record = params.edit
    ? rows.find((r) => r.id === params.edit)
    : undefined;
  if (params.edit && !record) notFound();
  return (
    <>
      <PageHeader
        eyebrow="АДМИНИСТРИРОВАНИЕ"
        title="Управление реестром"
        description="Создание и редактирование объектов, подрядчиков, договоров и гарантий. Изменения записываются в аудит."
      />
      <nav className="tabs" aria-label="Разделы реестра">
        {Object.entries(tabs).map(([key, label]) => (
          <Link
            className={tab === key ? "active" : ""}
            href={`/registry?tab=${key}`}
            key={key}
          >
            {label}
            <span>{d[key as typeof tab].length}</span>
          </Link>
        ))}
      </nav>
      <section className="panel">
        <div className="panel-title">
          <h2>{record ? "Редактирование записи" : "Новая запись"}</h2>
          {record && (
            <Link className="text-link" href={`/registry?tab=${tab}`}>
              Добавить новую
            </Link>
          )}
        </div>
        <RegistryForm
          key={`${tab}-${record?.id ?? "new"}`}
          kind={tab}
          data={{
            assets: d.assets,
            contracts: d.contracts,
            contractors: d.contractors,
          }}
          record={
            record as unknown as
              Record<string, string | number | null> | undefined
          }
        />
      </section>
      <section className="panel table-panel">
        <div className="panel-title">
          <h2>{tabs[tab]}</h2>
        </div>
        {rows.length ? (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Записи реестра"
          >
            <table>
              <thead>
                <tr>
                  <th>Запись</th>
                  <th>Идентификатор / срок</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {"name" in r
                        ? r.name
                        : "title" in r
                          ? r.title
                          : d.assets.find((a) => a.id === r.asset_id)?.name}
                    </td>
                    <td className="code">
                      {"asset_code" in r
                        ? r.asset_code
                        : "contract_number" in r
                          ? r.contract_number
                          : "bin_or_demo_identifier" in r
                            ? r.bin_or_demo_identifier
                            : date(r.expires_at)}
                    </td>
                    <td>
                      <Link
                        className="text-link"
                        href={`/registry?tab=${tab}&edit=${r.id}`}
                      >
                        Изменить
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
      </section>
    </>
  );
}
