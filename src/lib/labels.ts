export const statuses: Record<string, string> = {
  REPORTED: "Дефект зарегистрирован",
  CLAIM_CREATED: "Гарантийная заявка создана",
  RESOLVED: "Дефект устранён",
  OPEN: "Новая",
  ACKNOWLEDGED: "Принята",
  IN_PROGRESS: "В работе",
  REPAIR_SUBMITTED: "На проверке",
  VERIFIED: "Подтверждена",
  REJECTED: "На доработке",
  ACTIVE: "Действует",
  EXPIRED: "Истекла",
  NOT_FOUND: "Нет гарантии",
  SCHEDULED: "Ещё не началась",
  OVERDUE: "Просрочено",
  DUE_SOON: "Срок близко",
  ON_TIME: "В срок",
  COMPLETED: "Завершено",
  LOW: "Низкая",
  MEDIUM: "Средняя",
  HIGH: "Высокая",
  CRITICAL: "Критическая",
  APPROVED: "Принято",
};
export const categories: Record<string, string> = {
  WATER_LEAK: "Утечка трубы",
  LIGHTING: "Не работает освещение",
  SURFACE: "Повреждение покрытия",
  EQUIPMENT: "Поломка оборудования",
  OTHER: "Другое",
};
export const assetTypes: Record<string, string> = {
  WATER: "Водоснабжение",
  LIGHTING: "Освещение",
  ROAD: "Дороги",
  PUBLIC_SPACE: "Общественные пространства",
};
export const roleNames: Record<string, string> = {
  USER: "Пользователь",
  ADMIN: "Администратор",
  INSPECTOR: "Инспектор",
  CONTRACTOR: "Подрядчик",
};
export const auditNames: Record<string, string> = {
  PROFILE_ROLE_CHANGED: "Изменён доступ пользователя",
  DEFECT_SUBMITTED: "Зарегистрирован дефект",
  CLAIM_CREATED: "Создана гарантийная заявка",
  CLAIM_ACKNOWLEDGED: "Подрядчик принял заявку",
  REPAIR_STARTED: "Начат ремонт",
  REPAIR_SUBMITTED: "Ремонт передан на проверку",
  EVIDENCE_UPLOADED: "Добавлено подтверждение ремонта",
  VERIFICATION_APPROVED: "Инспектор принял ремонт",
  VERIFICATION_REJECTED: "Ремонт возвращён на доработку",
  DEADLINE_MISSED: "Зафиксирована просрочка",
  ASSET_CREATED: "Создан объект",
  WARRANTY_CREATED: "Добавлена гарантия",
  REGISTRY_UPDATED: "Обновлён реестр",
  CONTRACT_CREATED: "Добавлен договор",
  CONTRACTOR_CREATED: "Добавлен подрядчик",
};
export function date(value?: string | null, time = false) {
  return value
    ? new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Asia/Aqtau",
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(time ? ({ hour: "2-digit", minute: "2-digit" } as const) : {}),
      }).format(new Date(value))
    : "—";
}
export function claimCode(n: number) {
  return `KEP-${String(n).padStart(4, "0")}`;
}
