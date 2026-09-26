import Link from "next/link";
import { getDataset } from "@/lib/data";
import { PageHeader, Empty } from "@/components/ui";
import { ClaimsTable } from "@/components/tables";
export default async function ContractorPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const d = await getDataset();
  const { tab } = await searchParams;
  const selected = ["active", "review", "done"].includes(tab ?? "")
    ? tab
    : "active";
  const tabs = [
    {
      id: "active",
      label: "В работе",
      count: d.claims.filter(
        (c) => !["REPAIR_SUBMITTED", "VERIFIED"].includes(c.status),
      ).length,
    },
    {
      id: "review",
      label: "На проверке",
      count: d.claims.filter((c) => c.status === "REPAIR_SUBMITTED").length,
    },
    {
      id: "done",
      label: "Завершены",
      count: d.claims.filter((c) => c.status === "VERIFIED").length,
    },
  ];
  const claims = d.claims.filter((c) =>
    selected === "done"
      ? c.status === "VERIFIED"
      : selected === "review"
        ? c.status === "REPAIR_SUBMITTED"
        : !["REPAIR_SUBMITTED", "VERIFIED"].includes(c.status),
  );
  return (
    <>
      <PageHeader
        eyebrow="КАБИНЕТ ПОДРЯДЧИКА"
        title="Мои обязательства"
        description="Примите заявку, выполните ремонт и приложите фотографии для инспектора."
      />
      <div className="workspace-steps">
        <span>
          <b>1</b>Принять заявку
        </span>
        <span>
          <b>2</b>Начать ремонт
        </span>
        <span>
          <b>3</b>Добавить фото
        </span>
        <span>
          <b>4</b>Отправить на проверку
        </span>
      </div>
      <nav className="work-tabs" aria-label="Состояние заявок">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={`/contractor?tab=${item.id}`}
            aria-current={selected === item.id ? "page" : undefined}
            className={selected === item.id ? "active" : ""}
          >
            {item.label}
            <span>{item.count}</span>
          </Link>
        ))}
      </nav>
      {claims.length ? (
        <div className="panel table-panel">
          <ClaimsTable claims={claims} />
        </div>
      ) : (
        <section className="panel">
          <Empty title="В этом разделе нет заявок">
            {selected === "review"
              ? "Отправленные на проверку ремонты появятся здесь."
              : selected === "done"
                ? "Подтверждённые инспектором ремонты появятся здесь."
                : "Новые гарантийные претензии появятся после назначения вашей организации."}
          </Empty>
        </section>
      )}
    </>
  );
}
