// Demonstration records only. Stable IDs make reseeding non-destructive and reproducible.
export const uid = (group: number, n: number) =>
  `${group.toString().padStart(8, "0")}-0000-4000-8000-${n.toString().padStart(12, "0")}`;
export const demoOrganizations = [
  {
    id: uid(20, 1),
    name: "Муниципальная служба Актау · DEMO",
    type: "MUNICIPAL_SERVICE",
  },
  { id: uid(20, 2), name: "ТОО «Каспий Су Сервис» · DEMO", type: "CONTRACTOR" },
  { id: uid(20, 3), name: "ТОО «Актау Жарык» · DEMO", type: "CONTRACTOR" },
  {
    id: uid(20, 4),
    name: "ТОО «Мангистау Құрылыс» · DEMO",
    type: "CONTRACTOR",
  },
];
export const demoContractors = demoOrganizations
  .slice(1)
  .map((o, i) => ({
    id: uid(30, i + 1),
    organization_id: o.id,
    name: o.name,
    bin_or_demo_identifier: `DEMO-AKT-${i + 1}`,
    contact_name: "Демонстрационный диспетчер",
    contact_phone: "+7 (000) 000-00-00",
  }));
export const demoContracts = demoContractors.map((c, i) => ({
  id: uid(40, i + 1),
  contract_number: `DEMO-AKT-2025-${String(i + 1).padStart(3, "0")}`,
  contractor_id: c.id,
  title: [
    "Обновление сетей водоснабжения",
    "Модернизация уличного освещения",
    "Благоустройство городских пространств",
  ][i],
  start_date: "2024-06-01",
  completion_date: "2025-02-10",
  description: "Демонстрационный договор. Не является официальным документом.",
}));
const scenarios: [string, string, string, number, string][] = [
  [
    "Водопроводная сеть · 12 мкр.",
    "WATER",
    "12",
    1,
    "12 микрорайон, у дома № 18",
  ],
  [
    "Насосная станция · 14 мкр.",
    "WATER",
    "14",
    1,
    "14 микрорайон, техническая зона",
  ],
  [
    "Водопроводный узел · 11 мкр.",
    "WATER",
    "11",
    1,
    "11 микрорайон, у дома № 7",
  ],
  [
    "Уличное освещение · 15 мкр.",
    "LIGHTING",
    "15",
    2,
    "15 микрорайон, пешеходная аллея",
  ],
  [
    "Освещение набережной · 7 мкр.",
    "LIGHTING",
    "7",
    2,
    "7 микрорайон, прогулочная зона",
  ],
  [
    "Освещение двора · 16 мкр.",
    "LIGHTING",
    "16",
    2,
    "16 микрорайон, у дома № 22",
  ],
  [
    "Детская площадка · 17 мкр.",
    "PUBLIC_SPACE",
    "17",
    3,
    "17 микрорайон, придомовая территория",
  ],
  ["Тротуар · 3 мкр.", "ROAD", "3", 3, "3 микрорайон, пешеходный проход"],
  [
    "Сквер · 19 мкр.",
    "PUBLIC_SPACE",
    "19",
    3,
    "19 микрорайон, общественная зона",
  ],
  [
    "Ливневый отвод · 9 мкр.",
    "WATER",
    "9",
    1,
    "9 микрорайон, межквартальный проезд",
  ],
  ["Дворовое покрытие · 6 мкр.", "ROAD", "6", 3, "6 микрорайон, у дома № 10"],
  [
    "Световая опора · 32 мкр.",
    "LIGHTING",
    "32",
    2,
    "32 микрорайон, остановочная зона",
  ],
  [
    "Спортивная площадка · 29 мкр.",
    "PUBLIC_SPACE",
    "29",
    3,
    "29 микрорайон, дворовая территория",
  ],
  [
    "Водопроводный узел · 4 мкр.",
    "WATER",
    "4",
    1,
    "4 микрорайон, технический колодец",
  ],
];
export const demoAssets = scenarios.map(
  ([name, asset_type, microdistrict, contract, address], i) => ({
    id: uid(10, i + 1),
    name,
    asset_type,
    microdistrict,
    asset_code: `AKT-${asset_type === "WATER" ? "W" : asset_type === "LIGHTING" ? "L" : asset_type === "ROAD" ? "R" : "P"}-${String(i + 1).padStart(3, "0")}`,
    address: `Актау, ${address}`,
    contract_id: uid(40, contract),
    commissioned_at: "2025-02-12",
    description:
      "Демонстрационный объект по сценарию муниципальной инфраструктуры Актау. Не является официальной записью.",
  }),
);
export const demoWarranties = scenarios
  .slice(0, 13)
  .map((s, i) => ({
    id: uid(50, i + 1),
    asset_id: uid(10, i + 1),
    contractor_id: uid(30, s[3]),
    starts_at: "2025-02-12",
    expires_at:
      i === 9 || i === 10
        ? "2026-02-12"
        : i === 11
          ? "2027-01-15"
          : "2028-02-12",
    terms:
      "Устранение дефектов материалов и выполненных работ за счёт подрядчика. Демонстрационные условия.",
    status: "ACTIVE",
  }));
export const demoAccounts = [
  {
    email: "admin@kepil.demo",
    name: "Алия Сагындыкова",
    role: "ADMIN",
    org: uid(20, 1),
  },
  {
    email: "inspector@kepil.demo",
    name: "Данияр Омаров",
    role: "INSPECTOR",
    org: uid(20, 1),
  },
  {
    email: "contractor@kepil.demo",
    name: "Руслан Касымов",
    role: "CONTRACTOR",
    org: uid(20, 2),
  },
  {
    email: "lighting@kepil.demo",
    name: "Айбек Нурланов",
    role: "CONTRACTOR",
    org: uid(20, 3),
  },
  {
    email: "building@kepil.demo",
    name: "Марат Сулейменов",
    role: "CONTRACTOR",
    org: uid(20, 4),
  },
];
