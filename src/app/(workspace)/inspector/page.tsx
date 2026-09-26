import { redirect } from "next/navigation";
import { getDataset } from "@/lib/data";
import { PageHeader, Empty } from "@/components/ui";
import { ClaimsTable } from "@/components/tables";
export default async function InspectorPage() {
  const d = await getDataset();
  if (d.profile.role === "CONTRACTOR") redirect("/contractor");
  const queue = d.claims.filter((c) => c.status === "REPAIR_SUBMITTED");
  return (
    <>
      <PageHeader
        eyebrow="НЕЗАВИСИМАЯ ПРОВЕРКА РЕЗУЛЬТАТА"
        title="Ожидают проверки"
        description="Сопоставьте дефект с подтверждениями ремонта. Примите результат или верните с указанием причины."
      />
      {queue.length ? (
        <div className="panel table-panel">
          <ClaimsTable claims={queue} />
        </div>
      ) : (
        <section className="panel">
          <Empty title="Очередь приёмки пуста">
            Работы появятся здесь, когда подрядчик отправит ремонт и
            доказательства на проверку.
          </Empty>
        </section>
      )}
    </>
  );
}
