import { redirect } from "next/navigation";
import {
  ShieldCheck,
  ScanSearch,
  Building2,
  ClipboardCheck,
} from "lucide-react";
import { getDataset } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { DefectForm } from "@/components/forms";
export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ asset?: string }>;
}) {
  const d = await getDataset();
  if (d.profile.role === "CONTRACTOR") redirect("/contractor");
  const { asset } = await searchParams;
  return (
    <>
      <PageHeader
        eyebrow="НОВЫЙ ДЕФЕКТ"
        title="От проблемы — к ответственному"
        description="Зафиксируйте повреждение. KEPIL проверит гарантийные обязательства автоматически."
      />
      <div className="report-layout">
        <DefectForm
          assets={d.assets}
          selectedId={asset}
          requestId={crypto.randomUUID()}
        />
        <aside className="panel report-guide">
          <div className="guide-symbol">
            <ShieldCheck size={28} />
          </div>
          <h2>Что произойдёт дальше</h2>
          {[
            {
              icon: ShieldCheck,
              title: "Проверка гарантии",
              text: "Сопоставим объект и сроки действия гарантии на дату регистрации.",
            },
            {
              icon: Building2,
              title: "Определение подрядчика",
              text: "Найдём ответственную организацию по действующей гарантии.",
            },
            {
              icon: ScanSearch,
              title: "Поиск повторных дефектов",
              text: "Проверим ту же категорию на объекте за последние 90 дней.",
            },
            {
              icon: ClipboardCheck,
              title: "Заявка и сроки ремонта",
              text: "Создадим заявку, рассчитаем SLA и сохраним события в журнале.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div className="guide-step" key={title}>
              <Icon size={18} />
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </div>
          ))}
          <p className="guide-note">
            Если гарантия истекла, дефект останется в реестре для решения
            муниципальной службы.
          </p>
        </aside>
      </div>
    </>
  );
}
