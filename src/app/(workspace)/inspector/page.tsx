import { redirect } from "next/navigation";
import { getDataset } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { ClaimsTable } from "@/components/tables";
export default async function InspectorPage() {
  const d = await getDataset();
  if (d.profile.role === "CONTRACTOR") redirect("/contractor");
  const queue = d.claims.filter((c) => c.status === "REPAIR_SUBMITTED");
  return (
    <>
      <PageHeader
        eyebrow="НЕЗАВИСИМАЯ ПРОВЕРКА РЕЗУЛЬТАТА"
        title="Приёмка выполненных работ"
        description="Сопоставьте дефект с подтверждениями ремонта. Примите результат или верните с указанием причины."
      />
      <div className="notice info">
        <strong>{queue.length} заявок ожидают решения</strong>
        <span>
          Подтвердить ремонт может только инспектор или администратор.
        </span>
      </div>
      <div className="panel table-panel">
        <ClaimsTable
          claims={queue}
          emptyTitle="Очередь приёмки пуста"
          emptyDescription="Новые работы появятся здесь после отправки подрядчиком на проверку."
        />
      </div>
    </>
  );
}
