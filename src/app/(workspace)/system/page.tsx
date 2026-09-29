import { IntroTrigger } from "@/components/intro";

const workflow = [
  ["Объект", "В системе хранится объект, его контракт, подрядчик и гарантийный период."],
  ["Дефект", "При появлении проблемы дефект связывается с конкретным объектом."],
  ["Гарантия", "KEPIL проверяет, действует ли гарантийное обязательство."],
  ["Подрядчик", "Система определяет ответственного подрядчика."],
  ["Претензия", "Создаётся гарантийная претензия со статусом и сроком."],
  ["Ремонт", "Подрядчик выполняет работу и прикладывает доказательства."],
  ["Проверка", "Инспектор подтверждает результат или возвращает работу на исправление."],
  ["История", "Все ключевые действия сохраняются."],
] as const;

const technologies = [
  ["Next.js + TypeScript", "Интерфейс и серверная логика."],
  ["Supabase", "Авторизация, база данных и хранение файлов."],
  ["PostgreSQL", "Хранит объекты, гарантии, дефекты, претензии и историю."],
  ["Supabase Auth", "Отвечает за вход и пользовательские сессии."],
  ["Supabase Storage", "Хранит доказательства ремонта."],
  ["RBAC + RLS", "Ограничивают действия и доступ к данным по ролям."],
  ["Vercel", "На нём работает production-версия KEPIL."],
] as const;

const proofPoints = [
  "Реальные данные в PostgreSQL",
  "Роли USER / ADMIN / CONTRACTOR / INSPECTOR",
  "Серверная логика претензий",
  "История статусов",
  "Приватное хранение доказательств",
  "Повторные дефекты",
  "Production deployment",
];

export default function SystemPage() {
  return (
    <div className="system-guide">
      <header className="system-intro">
        <span className="eyebrow">О СИСТЕМЕ</span>
        <h1>Как работает KEPIL</h1>
        <p>От городского объекта до подтверждённого ремонта.</p>
        <IntroTrigger />
      </header>

      <div className="system-sheet">
        <section className="system-section" aria-labelledby="system-workflow">
          <h2 id="system-workflow">От объекта до истории</h2>
          <ol className="system-sequence" aria-label="Этапы работы KEPIL">
            {workflow.map(([step]) => <li key={step}>{step}</li>)}
          </ol>
          <dl className="system-explanations">
            {workflow.map(([step, description]) => (
              <div key={step}>
                <dt>{step}</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="system-section" aria-labelledby="system-difference">
          <h2 id="system-difference">Это не система жалоб</h2>
          <div className="system-comparison">
            <div>
              <h3>Обычная система обращений</h3>
              <ul>
                <li>Что сломалось?</li>
                <li>Где?</li>
                <li>Когда?</li>
              </ul>
            </div>
            <div>
              <h3>KEPIL</h3>
              <ul>
                <li>Кто отвечает?</li>
                <li>Действует ли гарантия?</li>
                <li>Какой срок ремонта?</li>
                <li>Ремонт подтверждён?</li>
                <li>Проблема повторяется?</li>
              </ul>
            </div>
          </div>
          <p className="system-conclusion">От фиксации проблемы — к контролю ответственности.</p>
        </section>

        <section className="system-section" aria-labelledby="system-stack">
          <h2 id="system-stack">Что работает внутри</h2>
          <dl className="system-rows">
            {technologies.map(([name, description]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="system-section" aria-labelledby="system-real">
          <h2 id="system-real">Не макет. Рабочая система.</h2>
          <ul className="system-proof">
            {proofPoints.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
