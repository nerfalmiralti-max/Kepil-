const workflow = [
  "Объект",
  "Гарантия",
  "Дефект",
  "Претензия",
  "Подрядчик",
  "Ремонт",
  "Проверка",
  "История",
];

const explanations = [
  ["Объект", "В системе хранится городской объект, его контракт, подрядчик и гарантийный период."],
  ["Дефект", "При появлении проблемы дефект связывается с конкретным объектом."],
  ["Гарантия", "KEPIL проверяет гарантийное обязательство и определяет ответственного подрядчика."],
  ["Претензия", "Создаётся гарантийная претензия со статусом, ответственным и сроком."],
  ["Ремонт", "Подрядчик выполняет работу и прикладывает доказательства."],
  ["Проверка", "Инспектор подтверждает результат или возвращает работу на исправление."],
  ["История", "Все ключевые действия и изменения статуса сохраняются в системе."],
];

const statuses = [
  ["Открыта", "OPEN"],
  ["Принята", "ACKNOWLEDGED"],
  ["В работе", "IN_PROGRESS"],
  ["На проверке", "REPAIR_SUBMITTED"],
  ["Подтверждена", "VERIFIED"],
];

const roles = [
  ["USER", "Обычный пользователь системы."],
  ["ADMIN", "Управляет пользователями и доступом."],
  ["CONTRACTOR", "Работает только со своими обязательствами."],
  ["INSPECTOR", "Проверяет выполненный ремонт."],
];

const technologies = [
  ["Next.js + TypeScript", "Интерфейс и серверная логика приложения."],
  ["Supabase", "Авторизация, база данных и хранение файлов."],
  ["PostgreSQL", "Хранит объекты, гарантии, дефекты, претензии и историю."],
  ["Supabase Auth", "Отвечает за вход и пользовательские сессии."],
  ["Supabase Storage", "Хранит доказательства ремонта."],
  ["RBAC + RLS", "Ограничивают доступ к функциям и данным в зависимости от роли."],
  ["Vercel", "На нём работает production-версия KEPIL."],
];

export default function SystemPage() {
  return (
    <div className="system-guide">
      <header className="system-intro">
        <span className="eyebrow">О СИСТЕМЕ</span>
        <h1>Как работает KEPIL</h1>
        <p>
          Гарантийный контроль городской инфраструктуры — от объекта до
          подтверждённого ремонта.
        </p>
      </header>

      <div className="system-sheet">
        <section className="system-section" aria-labelledby="system-workflow">
          <h2 id="system-workflow">От объекта до истории</h2>
          <ol className="system-sequence" aria-label="Этапы работы KEPIL">
            {workflow.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <dl className="system-explanations">
            {explanations.map(([title, description]) => (
              <div key={title}>
                <dt>{title}</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="system-columns">
          <section className="system-section" aria-labelledby="system-persistence">
            <h2 id="system-persistence">Данные не хранятся только в браузере</h2>
            <p>
              Объекты, гарантии, дефекты, претензии и история действий
              сохраняются в PostgreSQL. После обновления страницы состояние не
              исчезает.
            </p>
            <span className="system-persistence-label">F5 → данные сохраняются</span>
          </section>
          <section className="system-section" aria-labelledby="system-statuses">
            <h2 id="system-statuses">Жизненный цикл претензии</h2>
            <ol className="system-states">
              {statuses.map(([label, code]) => (
                <li key={code}><strong>{label}</strong><code>{code}</code></li>
              ))}
            </ol>
            <p>
              Статус нельзя произвольно переключить на любой этап. Система
              контролирует допустимые переходы.
            </p>
          </section>
        </div>

        <div className="system-columns">
          <section className="system-section" aria-labelledby="system-access">
            <h2 id="system-access">Кто что может делать</h2>
            <dl className="system-rows">
              {roles.map(([role, description]) => (
                <div key={role}><dt>{role}</dt><dd>{description}</dd></div>
              ))}
            </dl>
            <p>
              Ограничения работают не только в интерфейсе. Доступ к данным
              дополнительно контролируется через RBAC и Row Level Security.
            </p>
          </section>
          <section className="system-section" aria-labelledby="system-stack">
            <h2 id="system-stack">Техническая основа</h2>
            <dl className="system-rows">
              {technologies.map(([name, description]) => (
                <div key={name}><dt>{name}</dt><dd>{description}</dd></div>
              ))}
            </dl>
          </section>
        </div>

        <section className="system-section" aria-labelledby="system-architecture">
          <h2 id="system-architecture">Как связаны части системы</h2>
          <div className="system-architecture">
            <ol aria-label="Основной путь данных">
              <li>Пользователь</li>
              <li>Next.js</li>
              <li>Supabase Auth</li>
              <li>PostgreSQL</li>
              <li>Гарантии / Претензии / История</li>
            </ol>
            <div className="system-storage">
              <strong>Supabase Storage</strong>
              <span>Фото и доказательства</span>
            </div>
          </div>
        </section>

        <section className="system-section" aria-labelledby="system-repeat">
          <h2 id="system-repeat">Повторный дефект</h2>
          <p>
            Если после подтверждённого ремонта проблема появляется снова,
            KEPIL сохраняет связь с предыдущей историей объекта.
          </p>
          <ol className="system-sequence system-repeat-sequence" aria-label="Пример повторного дефекта">
            <li>Первый дефект</li>
            <li>Ремонт подтверждён</li>
            <li>Проблема появилась снова</li>
            <li>Повторный дефект</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
