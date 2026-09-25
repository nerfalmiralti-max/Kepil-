import Link from "next/link";
import { Plus } from "lucide-react";
import { getDataset } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { AssetsTable } from "@/components/tables";
export default async function AssetsPage() {
  const d = await getDataset();
  return (
    <>
      <PageHeader
        eyebrow="ГОРОДСКАЯ ИНФРАСТРУКТУРА"
        title="Реестр объектов"
        description="У каждого объекта — договор, ответственный подрядчик и гарантийная история."
        action={
          d.profile.role === "ADMIN" ? (
            <Link className="button primary" href="/registry?tab=assets">
              <Plus size={17} />
              Добавить объект
            </Link>
          ) : undefined
        }
      />
      <AssetsTable
        assets={d.assets}
        warranties={d.warranties}
        contractors={d.contractors}
        contracts={d.contracts}
        today={d.today}
      />
    </>
  );
}
