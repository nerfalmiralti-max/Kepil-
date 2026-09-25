import {
  ShieldCheck,
  Database,
  Workflow,
  LockKeyhole,
  ScanSearch,
  Clock3,
  FileCheck2,
  Server,
  ArrowRight,
  Camera,
  Building2,
} from "lucide-react";
import { getDataset, getProfile } from "@/lib/data";
import { PageHeader } from "@/components/ui";
export default async function SystemPage() {
  const profile = await getProfile();
  const d = profile.role === "USER" ? null : await getDataset();
  const capabilities = [
    {
      icon: ShieldCheck,
      title: "Гарантийный движок",
      text: "Проверяет объект, даты гарантии по времени Актау и выбирает ответственного подрядчика.",
    },
    {
      icon: Building2,
      title: "Назначение ответственности",
      text: "Связывает дефект с гарантией, подрядчиком и договором. Создаёт заявку и уведомление.",
    },
    {
      icon: Workflow,
      title: "Переходы статусов",
      text: "OPEN → ACKNOWLEDGED → IN_PROGRESS → REPAIR_SUBMITTED → VERIFIED. Отклонение возвращает ремонт на доработку.",
    },
    {
      icon: ScanSearch,
      title: "Повторные дефекты",
      text: "Сравнивает объект и категорию за 90 дней. Возвращает количество случаев и ссылки на прошлые дефекты.",
    },
    {
      icon: Clock3,
      title: "Контроль SLA",
      text: "Срок реакции: 4–24 часа. Ремонт: 1–14 дней по критичности. Просрочка определяется сервером.",
    },
    {
      icon: LockKeyhole,
      title: "Роли и изоляция",
      text: "Supabase Auth, серверная проверка профиля и PostgreSQL RLS. Подрядчик видит только свою организацию.",
    },
    {
      icon: FileCheck2,
      title: "История и аудит",
      text: "Все значимые изменения сохраняются в одной транзакции с операцией. Прямое изменение журнала запрещено.",
    },
    {
      icon: Camera,
      title: "Приватные фотографии",
      text: "Supabase Storage, проверка декодирования фото, размера до 3 МБ и разрешения до 25 Мп. Краткосрочные подписанные ссылки.",
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="ТЕХНИЧЕСКАЯ АРХИТЕКТУРА"
        title="Что делает backend KEPIL"
        description="Реальные правила, база данных и прослеживаемая ответственность. Для технических вопросов жюри."
      />
      <div className="notice success">
        <Database size={20} />
        <strong>База подключена</strong>
        <span>
          {d
            ? `${d.assets.length} доступных объектов · ${d.claims.length} доступных заявок · `
            : ""}
          Supabase PostgreSQL
        </span>
      </div>
      <section className="panel">
        <h2>Один запрос — одна последовательная операция</h2>
        <div className="architecture-flow">
          {[
            { icon: Workflow, title: "Интерфейс", sub: "Next.js / React" },
            { icon: Server, title: "Сервер", sub: "Server Actions + Zod" },
            { icon: LockKeyhole, title: "Доступ", sub: "Auth + профиль + RLS" },
            {
              icon: ShieldCheck,
              title: "Бизнес-правила",
              sub: "Транзакционные RPC",
            },
            { icon: Database, title: "Хранение", sub: "PostgreSQL + Storage" },
          ].map(({ icon: Icon, title, sub }, i) => (
            <div key={title}>
              <div className="architecture-node">
                <Icon size={25} />
                <strong>{title}</strong>
                <span>{sub}</span>
              </div>
              {i < 4 && <ArrowRight className="architecture-arrow" size={20} />}
            </div>
          ))}
        </div>
      </section>
      <div className="capabilities-grid">
        {capabilities.map(({ icon: Icon, title, text }) => (
          <section className="panel capability" key={title}>
            <Icon size={22} />
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
      </div>
      <section className="panel">
        <h2>Как муниципальная служба использует систему</h2>
        <p className="description-text">
          Акимат ведёт реестр принятых объектов и гарантий по договорам.
          Инспектор фиксирует дефект. KEPIL определяет, обязан ли подрядчик
          устранить его по гарантии, назначает сроки и сохраняет историю.
          Подрядчик подтверждает ремонт фотографиями. Инспектор проверяет
          результат, а руководитель видит просрочки и повторные дефекты.
        </p>
        <div className="notice warning">
          В реестре используются демонстрационные записи по сценариям Актау. Это
          не официальные данные акимата. Интеграция с государственными реестрами
          и юридический электронный документооборот в MVP не подключены.
        </div>
        <p className="small muted">
          SLA фиксируется при открытии системы и изменениях статуса; фоновой
          рассылки нет. Окно повторных дефектов хранится в private.settings.
          Карточки перечитывают базу после каждой операции; realtime-подписки не
          используются.
        </p>
      </section>
    </>
  );
}
