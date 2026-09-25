import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import {
  demoAccounts,
  demoAssets,
  demoContractors,
  demoContracts,
  demoOrganizations,
  demoWarranties,
  uid,
} from "./demo-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.DEMO_PASSWORD;
if (!url || !key || !password || password.length < 12)
  throw new Error(
    "Set Supabase URL, server-only service-role key and DEMO_PASSWORD (at least 12 characters) in .env.local.",
  );
const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
async function checked<T>(
  query: PromiseLike<{ data: T; error: { message: string } | null }>,
) {
  const r = await query;
  if (r.error) throw new Error(r.error.message);
  return r.data;
}
async function seed() {
  await checked(
    db
      .from("organizations")
      .upsert(demoOrganizations, { onConflict: "id", ignoreDuplicates: true }),
  );
  const users: { id: string; role: string; org: string }[] = [];
  const all = [];
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    all.push(...data.users);
    if (data.users.length < 1000) break;
  }
  for (const account of demoAccounts) {
    let user = all.find((u) => u.email === account.email);
    if (!user) {
      const { data, error } = await db.auth.admin.createUser({
        email: account.email,
        password,
        email_confirm: true,
      });
      if (error) throw error;
      user = data.user;
    }
    const existing = await checked(
      db
        .from("profiles")
        .select("organization_id,role")
        .eq("id", user.id)
        .maybeSingle(),
    );
    if (
      existing &&
      (existing.organization_id !== account.org ||
        existing.role !== account.role)
    )
      throw new Error(
        `Existing account ${account.email} belongs to another role/organization; seed stopped.`,
      );
    await checked(
      db
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: account.email,
            full_name: account.name,
            role: account.role,
            organization_id: account.org,
          },
          { onConflict: "id", ignoreDuplicates: true },
        ),
    );
    users.push({ id: user.id, role: account.role, org: account.org });
  }
  await checked(
    db
      .from("contractors")
      .upsert(demoContractors, { onConflict: "id", ignoreDuplicates: true }),
  );
  await checked(
    db
      .from("contracts")
      .upsert(demoContracts, { onConflict: "id", ignoreDuplicates: true }),
  );
  await checked(
    db
      .from("assets")
      .upsert(demoAssets, { onConflict: "id", ignoreDuplicates: true }),
  );
  await checked(
    db
      .from("warranties")
      .upsert(demoWarranties, { onConflict: "id", ignoreDuplicates: true }),
  );
  const ago = (days: number) =>
    new Date(Date.now() - days * 86400000).toISOString();
  const scenarios: [number, string, string, string, number, string][] = [
    [1, "WATER_LEAK", "VERIFIED", "Утечка соединения водопровода", 41, "HIGH"],
    [
      1,
      "WATER_LEAK",
      "OPEN",
      "Повторная утечка в техническом колодце",
      2,
      "HIGH",
    ],
    [2, "EQUIPMENT", "IN_PROGRESS", "Сбой насосного оборудования", 5, "HIGH"],
    [
      4,
      "LIGHTING",
      "REPAIR_SUBMITTED",
      "Не работают три светильника",
      4,
      "MEDIUM",
    ],
    [
      5,
      "LIGHTING",
      "ACKNOWLEDGED",
      "Мерцание освещения набережной",
      1,
      "MEDIUM",
    ],
    [
      7,
      "EQUIPMENT",
      "REJECTED",
      "Повреждён крепёж игрового оборудования",
      9,
      "HIGH",
    ],
    [8, "SURFACE", "VERIFIED", "Просадка тротуарного покрытия", 18, "MEDIUM"],
    [12, "LIGHTING", "OPEN", "Повреждение кабельной линии", 0.2, "HIGH"],
    [10, "WATER_LEAK", "REPORTED", "Подтопление ливневого отвода", 1, "MEDIUM"],
  ];
  const evidenceImage = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540"><rect width="900" height="540" fill="#edf5f7"/><rect x="40" y="40" width="820" height="460" rx="12" fill="white" stroke="#c7dce2"/><text x="80" y="105" font-family="sans-serif" font-size="22" fill="#087e8b">KEPIL · DEMO EVIDENCE</text><path d="M100 255h270v-50h160v100h250" fill="none" stroke="#8eb7c2" stroke-width="44"/><path d="M100 255h270v-50h160v100h250" fill="none" stroke="#d1e8ec" stroke-width="25"/><circle cx="450" cy="205" r="39" fill="#087e8b"/><path d="m432 205 12 12 24-27" fill="none" stroke="white" stroke-width="6"/><text x="80" y="402" font-family="sans-serif" font-size="21" fill="#183746">Demonstration repair record</text><text x="80" y="440" font-family="sans-serif" font-size="16" fill="#647d88">Illustration only. Not a photograph of municipal works.</text></svg>`,
    ),
  )
    .png()
    .toBuffer();
  for (let i = 0; i < scenarios.length; i++) {
    const [assetNumber, category, status, title, age, severity] = scenarios[i];
    const defectId = uid(60, i + 1);
    const claimId = uid(70, i + 1);
    const exists = await checked(
      db
        .from("audit_logs")
        .select("id")
        .eq("id", uid(99, i + 1))
        .maybeSingle(),
    );
    if (exists) continue;
    const repeat = i === 1;
    const warranty = demoWarranties.find(
      (w) => w.asset_id === uid(10, assetNumber),
    )!;
    await checked(
      db
        .from("defects")
        .upsert(
          {
            id: defectId,
            asset_id: uid(10, assetNumber),
            title,
            description: `${title}. Демонстрационная запись для проверки гарантийного процесса KEPIL.`,
            category,
            severity,
            reporter_id: users[1].id,
            reported_at: ago(age),
            created_at: ago(age),
            status:
              status === "VERIFIED"
                ? "RESOLVED"
                : status === "REPORTED"
                  ? "REPORTED"
                  : "CLAIM_CREATED",
            repeat_defect: repeat,
            repeat_count: repeat ? 2 : 1,
            previous_defect_ids: repeat ? [uid(60, 1)] : [],
            request_id: uid(80, i + 1),
          },
          { onConflict: "id", ignoreDuplicates: true },
        ),
    );
    if (status === "REPORTED") {
      await checked(
        db
          .from("audit_logs")
          .upsert(
            {
              id: uid(99, i + 1),
              actor_id: users[1].id,
              actor_name: demoAccounts[1].name,
              action: "DEMO_SEED_COMPLETE",
              entity_type: "defect",
              entity_id: defectId,
              metadata: { demo: true },
            },
            { onConflict: "id", ignoreDuplicates: true },
          ),
      );
      continue;
    }
    const submitted = ["VERIFIED", "REPAIR_SUBMITTED", "REJECTED"].includes(
      status,
    );
    const completed = submitted ? ago(age - 2) : null;
    await checked(
      db
        .from("warranty_claims")
        .upsert(
          {
            id: claimId,
            defect_id: defectId,
            warranty_id: warranty.id,
            contractor_id: warranty.contractor_id,
            status,
            response_deadline: ago(age - 0.5),
            repair_deadline: ago(age - (severity === "HIGH" ? 3 : 7)),
            assigned_at: ago(age),
            created_at: ago(age),
            acknowledged_at: status === "OPEN" ? null : ago(age - 0.2),
            completed_at: status === "REJECTED" ? null : completed,
            verified_at: status === "VERIFIED" ? ago(age - 3) : null,
            rejected_at: status === "REJECTED" ? ago(age - 3) : null,
          },
          { onConflict: "id", ignoreDuplicates: true },
        ),
    );
    const contractor = demoContractors.find(
      (c) => c.id === warranty.contractor_id,
    )!;
    const worker = users.find((u) => u.org === contractor.organization_id)!;
    const stages = [
      "OPEN",
      ...(status !== "OPEN" ? ["ACKNOWLEDGED"] : []),
      ...(["IN_PROGRESS", "REPAIR_SUBMITTED", "VERIFIED", "REJECTED"].includes(
        status,
      )
        ? ["IN_PROGRESS"]
        : []),
      ...(submitted ? ["REPAIR_SUBMITTED"] : []),
      ...(["VERIFIED", "REJECTED"].includes(status) ? [status] : []),
    ];
    for (let j = 0; j < stages.length; j++) {
      const stage = stages[j];
      const actor =
        stage === "OPEN" || stage === "VERIFIED" || stage === "REJECTED"
          ? users[1]
          : worker;
      const actorAccount = demoAccounts.find(
        (a) => a.org === actor.org && a.role === actor.role,
      )!;
      const eventTime = ago(
        age -
          (stage === "OPEN"
            ? 0
            : stage === "ACKNOWLEDGED"
              ? 0.2
              : stage === "IN_PROGRESS"
                ? 1
                : stage === "REPAIR_SUBMITTED"
                  ? 2
                  : 3),
      );
      await checked(
        db
          .from("status_history")
          .upsert(
            {
              id: uid(90, i * 10 + j + 1),
              entity_type: "claim",
              entity_id: claimId,
              from_status: j ? stages[j - 1] : null,
              to_status: stage,
              changed_by: actor.id,
              actor_name: actorAccount.name,
              reason:
                stage === "REJECTED"
                  ? "Демонстрационная проверка: требуется повторное закрепление элемента."
                  : "Демонстрационное историческое событие.",
              created_at: eventTime,
            },
            { onConflict: "id", ignoreDuplicates: true },
          ),
      );
      const action =
        stage === "OPEN"
          ? "CLAIM_CREATED"
          : stage === "ACKNOWLEDGED"
            ? "CLAIM_ACKNOWLEDGED"
            : stage === "IN_PROGRESS"
              ? "REPAIR_STARTED"
              : stage === "VERIFIED"
                ? "VERIFICATION_APPROVED"
                : stage === "REJECTED"
                  ? "VERIFICATION_REJECTED"
                  : "REPAIR_SUBMITTED";
      await checked(
        db
          .from("audit_logs")
          .upsert(
            {
              id: uid(91, i * 10 + j + 1),
              actor_id: actor.id,
              actor_name: actorAccount.name,
              action,
              entity_type: "claim",
              entity_id: claimId,
              metadata: { demo: true, historicalSeed: true },
              created_at: eventTime,
            },
            { onConflict: "id", ignoreDuplicates: true },
          ),
      );
    }
    if (submitted) {
      const path = `${claimId}/demo-evidence.png`;
      const { error } = await db.storage
        .from("claim-evidence")
        .upload(path, evidenceImage, {
          contentType: "image/png",
          upsert: true,
        });
      if (error) throw error;
      await checked(
        db
          .from("claim_evidence")
          .upsert(
            {
              id: uid(92, i + 1),
              claim_id: claimId,
              uploaded_by: worker.id,
              storage_path: path,
              evidence_type: "AFTER",
              note: "DEMO: иллюстрация для демонстрации интерфейса. Не фотография реальных работ.",
              created_at: completed!,
            },
            { onConflict: "id", ignoreDuplicates: true },
          ),
      );
      if (status === "VERIFIED" || status === "REJECTED")
        await checked(
          db
            .from("inspections")
            .upsert(
              {
                id: uid(93, i + 1),
                claim_id: claimId,
                inspector_id: users[1].id,
                result: status === "VERIFIED" ? "APPROVED" : "REJECTED",
                comment:
                  status === "VERIFIED"
                    ? "Демонстрационный ремонт принят."
                    : "Демонстрационная проверка: требуется доработка.",
                created_at: ago(age - 3),
              },
              { onConflict: "id", ignoreDuplicates: true },
            ),
        );
    }
    await checked(
      db
        .from("notifications")
        .upsert(
          {
            id: uid(94, i + 1),
            user_id: worker.id,
            claim_id: claimId,
            type: "CLAIM_CREATED",
            title: "Демонстрационная гарантийная заявка",
            body: title,
            created_at: ago(age),
          },
          { onConflict: "id", ignoreDuplicates: true },
        ),
    );
    await checked(
      db
        .from("audit_logs")
        .upsert(
          {
            id: uid(99, i + 1),
            actor_id: users[1].id,
            actor_name: demoAccounts[1].name,
            action: "DEMO_SEED_COMPLETE",
            entity_type: "claim",
            entity_id: claimId,
            metadata: { demo: true },
          },
          { onConflict: "id", ignoreDuplicates: true },
        ),
    );
  }
  const counts = await Promise.all(
    ["assets", "warranty_claims", "profiles"].map(async (table) => {
      const { count, error } = await db
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return `${table}: ${count}`;
    }),
  );
  console.log(
    `Seed complete. ${counts.join(", ")}. Existing records/passwords preserved.`,
  );
  console.log(
    "Demo accounts:",
    demoAccounts.map((a) => `${a.email} (${a.role})`).join(", "),
  );
}
seed().catch((e) => {
  console.error(`Seed failed: ${e.message}`);
  process.exitCode = 1;
});
