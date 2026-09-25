import Link from "next/link";
import { Plus } from "lucide-react";
import { getDataset } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { ClaimsTable } from "@/components/tables";
export default async function ClaimsPage() {
  const d = await getDataset();
  return (
    <>
      <PageHeader
        eyebrow="ГАРАНТИЙНЫЕ ОБЯЗАТЕЛЬСТВА"
        title="Заявки на устранение дефектов"
        description="Контроль каждого этапа — от назначения подрядчика до приёмки инспектором."
        action={
          d.profile.role !== "CONTRACTOR" ? (
            <Link className="button primary" href="/defects/new">
              <Plus size={17} />
              Новый дефект
            </Link>
          ) : undefined
        }
      />
      <div className="panel table-panel">
        <ClaimsTable claims={d.claims} />
      </div>
    </>
  );
}
