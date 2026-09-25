import { getDataset } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { ClaimsTable } from "@/components/tables";
export default async function ContractorPage() {
  const d = await getDataset();
  return (
    <>
      <PageHeader
        eyebrow="КАБИНЕТ ПОДРЯДЧИКА"
        title="Мои гарантийные обязательства"
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
      <div className="panel table-panel">
        <ClaimsTable claims={d.claims} />
      </div>
    </>
  );
}
