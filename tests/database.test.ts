import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { migrate } from "./migrations";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const admin = "00000000-0000-4000-8000-000000000001";
const inspector = "00000000-0000-4000-8000-000000000002";
const contractor = "00000000-0000-4000-8000-000000000003";
const outsider = "00000000-0000-4000-8000-000000000004";
const asset = "10000000-0000-4000-8000-000000000001";
const expired = "10000000-0000-4000-8000-000000000002";
async function as(id: string) {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
}
async function report(
  id = asset,
  category = "WATER_LEAK",
  requestId = crypto.randomUUID(),
) {
  const r = await db.query<{
    result: {
      claimId: string | null;
      warrantyStatus: string;
      contractor: { id: string };
      repeatCount: number;
      repeatDefect: boolean;
      defectId: string;
      remainingWarrantyDays: number;
    };
  }>(
    "select public.submit_defect($1, $2, 'HIGH', 'Утечка трубы', 'Обнаружена утечка на соединении трубы.', $3) as result",
    [id, category, requestId],
  );
  return r.rows[0].result;
}
async function transition(id: string, status: string, comment = "") {
  return db.query("select public.transition_claim($1, $2, $3)", [
    id,
    status,
    comment,
  ]);
}
before(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(), bucket_id text, name text, owner_id text, metadata jsonb, created_at timestamptz not null default now());
    alter table storage.objects enable row level security;
    grant usage on schema auth, storage to authenticated;
    grant select, insert, delete on storage.objects to authenticated;`);
  await migrate(db);
  await db.exec(`insert into auth.users values ('${admin}'), ('${inspector}'), ('${contractor}'), ('${outsider}');
    insert into organizations(id,name,type) values ('20000000-0000-4000-8000-000000000001','Город','AKIMAT'),('20000000-0000-4000-8000-000000000002','Подрядчик A','CONTRACTOR'),('20000000-0000-4000-8000-000000000003','Подрядчик B','CONTRACTOR');
    insert into profiles(id,email,full_name,role,organization_id) values
    ('${admin}','admin@test.kz','Администратор','ADMIN','20000000-0000-4000-8000-000000000001'),
    ('${inspector}','inspector@test.kz','Инспектор','INSPECTOR','20000000-0000-4000-8000-000000000001'),
    ('${contractor}','contractor@test.kz','Подрядчик','CONTRACTOR','20000000-0000-4000-8000-000000000002'),
    ('${outsider}','outsider@test.kz','Другой подрядчик','CONTRACTOR','20000000-0000-4000-8000-000000000003');
    insert into contractors(id,organization_id,name,bin_or_demo_identifier) values ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','A','DEMO-A');
    insert into contracts(id,contract_number,contractor_id,title,start_date,completion_date) values ('40000000-0000-4000-8000-000000000001','TEST-1','30000000-0000-4000-8000-000000000001','Тестовый договор',current_date-200,current_date-100);
    insert into assets(id,name,asset_code,asset_type,microdistrict,address,contract_id,commissioned_at) values
    ('${asset}','Труба','AKT-001','WATER','12','Актау','40000000-0000-4000-8000-000000000001',current_date-100),
    ('${expired}','Старая труба','AKT-002','WATER','14','Актау','40000000-0000-4000-8000-000000000001',current_date-100);
    insert into warranties(asset_id,contractor_id,starts_at,expires_at,terms) values
    ('${asset}','30000000-0000-4000-8000-000000000001',current_date-90,current_date+503,'Ремонт'),
    ('${expired}','30000000-0000-4000-8000-000000000001',current_date-90,current_date-1,'Ремонт');`);
});
after(async () => db.close());

async function newAsset() {
  const id = crypto.randomUUID();
  await db.query(
    "insert into assets(id,name,asset_code,asset_type,microdistrict,address,contract_id,commissioned_at) values($1,'Тестовый объект',$2,'WATER','12','Актау','40000000-0000-4000-8000-000000000001',public.server_today()-100)",
    [id, `TEST-${id}`],
  );
  return id;
}
async function addWarranty(
  aid: string,
  startOffset: number,
  endOffset: number,
) {
  const id = crypto.randomUUID();
  await db.query(
    "insert into warranties(id,asset_id,contractor_id,starts_at,expires_at,terms) values($1,$2,'30000000-0000-4000-8000-000000000001',public.server_today()+$3::int,public.server_today()+$4::int,'Гарантия')",
    [id, aid, startOffset, endOffset],
  );
  return id;
}
test("no warranty persists defect without claim", async () => {
  await as(inspector);
  const id = await newAsset();
  const r = await report(id);
  assert.equal(r.warrantyStatus, "NOT_FOUND");
  assert.equal(r.claimId, null);
  assert.equal(
    (
      await db.query<{ status: string }>(
        "select status from defects where id=$1",
        [r.defectId],
      )
    ).rows[0].status,
    "REPORTED",
  );
});
test("future warranty is not matched and read model exposes server status", async () => {
  await as(inspector);
  const id = await newAsset();
  const wid = await addWarranty(id, 1, 100);
  const r = await report(id);
  assert.equal(r.warrantyStatus, "NOT_FOUND");
  assert.equal(r.claimId, null);
  const view = await db.query<{ computed_status: string }>(
    "select computed_status from public.warranties_overview where id=$1",
    [wid],
  );
  assert.equal(view.rows[0].computed_status, "SCHEDULED");
});
test("among expired future and active warranties the applicable warranty is selected", async () => {
  await as(inspector);
  const id = await newAsset();
  await addWarranty(id, -100, -1);
  await addWarranty(id, 100, 200);
  const activeId = await addWarranty(id, -10, 20);
  const r = await report(id);
  assert.equal(r.warrantyStatus, "ACTIVE");
  assert.equal(r.remainingWarrantyDays, 20);
  assert.equal(
    (
      await db.query<{ warranty_id: string }>(
        "select warranty_id from warranty_claims where id=$1",
        [r.claimId],
      )
    ).rows[0].warranty_id,
    activeId,
  );
});
test("warranty expiry day remains covered through the Aktau calendar date", async () => {
  await as(inspector);
  const id = await newAsset();
  await addWarranty(id, -10, 0);
  const r = await report(id);
  assert.equal(r.warrantyStatus, "ACTIVE");
  assert.equal(r.remainingWarrantyDays, 0);
  assert.ok(r.claimId);
});
test("dates must be finite ordered and contractor foreign key must exist", async () => {
  const id = await newAsset();
  await assert.rejects(addWarranty(id, 5, 1), /check/i);
  await assert.rejects(
    db.query(
      "insert into warranties(asset_id,contractor_id,starts_at,expires_at,terms) values($1,'30000000-0000-4000-8000-000000000001',public.server_today(),'infinity','Invalid')",
      [id],
    ),
    /check/i,
  );
  await assert.rejects(
    db.query(
      "insert into warranties(asset_id,contractor_id,starts_at,expires_at,terms) values($1,$2,public.server_today(),public.server_today()+10,'Invalid')",
      [id, crypto.randomUUID()],
    ),
    /foreign key/i,
  );
});
test("repeat matching excludes unrelated categories and incidents outside the configured window", async () => {
  await as(inspector);
  const id = await newAsset();
  await addWarranty(id, -95, 100);
  const old = await report(id);
  await db.query(
    "update defects set reported_at=now()-interval '91 days' where id=$1",
    [old.defectId],
  );
  const other = await report(id, "LIGHTING");
  assert.equal(other.repeatDefect, false);
  const latest = await report(id);
  assert.equal(latest.repeatDefect, false);
  assert.equal(latest.repeatCount, 1);
  const repeated = await report(id);
  assert.equal(repeated.repeatDefect, true);
  assert.equal(repeated.repeatCount, 2);
});

test("active warranty creates persisted claim with correct contractor and audit atomically", async () => {
  await as(inspector);
  const result = await report();
  assert.equal(result.warrantyStatus, "ACTIVE");
  assert.ok(result.claimId);
  assert.equal(result.contractor.id, "30000000-0000-4000-8000-000000000001");
  const q = await db.query<{ status: string }>(
    "select status from warranty_claims where id=$1",
    [result.claimId],
  );
  assert.equal(q.rows[0].status, "OPEN");
  const a = await db.query<{ action: string }>(
    "select action from audit_logs where entity_id=$1",
    [result.claimId],
  );
  assert.ok(a.rows.some((r) => r.action === "CLAIM_CREATED"));
});
test("expired warranty keeps defect without automatic claim", async () => {
  await as(inspector);
  const r = await report(expired);
  assert.equal(r.warrantyStatus, "EXPIRED");
  assert.equal(r.claimId, null);
});
test("same category repeat is detected from persisted previous defects", async () => {
  await as(inspector);
  const r = await report();
  assert.equal(r.repeatDefect, true);
  assert.ok(r.repeatCount >= 2);
});
test("retrying same request does not duplicate defect or claim", async () => {
  await as(inspector);
  const key = crypto.randomUUID();
  const a = await report(asset, "OTHER", key);
  const b = await report(asset, "OTHER", key);
  assert.equal(a.claimId, b.claimId);
  assert.equal(a.defectId, b.defectId);
});
test("invalid transition and contractor self-verification are rejected", async () => {
  await as(inspector);
  const r = await report();
  await as(contractor);
  await assert.rejects(transition(r.claimId!, "IN_PROGRESS"), /transition/i);
  await assert.rejects(
    transition(r.claimId!, "VERIFIED"),
    /permission|inspector/i,
  );
});
test("unrelated contractor cannot access or mutate assigned claims", async () => {
  await as(inspector);
  const r = await report();
  await as(outsider);
  await assert.rejects(
    transition(r.claimId!, "ACKNOWLEDGED"),
    /permission|access/i,
  );
  await db.exec("set role authenticated");
  try {
    const q = await db.query("select id from warranty_claims where id=$1", [
      r.claimId,
    ]);
    assert.equal(q.rows.length, 0);
  } finally {
    await db.exec("reset role");
  }
});
test("repair requires evidence and inspector can approve submitted repair", async () => {
  await as(inspector);
  const r = await report();
  await as(contractor);
  await transition(r.claimId!, "ACKNOWLEDGED");
  await transition(r.claimId!, "IN_PROGRESS");
  await assert.rejects(transition(r.claimId!, "REPAIR_SUBMITTED"), /evidence/i);
  const path = `${r.claimId}/${crypto.randomUUID()}.png`;
  await db.query(
    'insert into storage.objects(bucket_id,name,owner_id,metadata) values (\'claim-evidence\',$1,$2,\'{"mimetype":"image/png","size":100}\')',
    [path, contractor],
  );
  await db.query(
    "select public.record_evidence($1,$2,'AFTER','Заменено соединение')",
    [r.claimId, path],
  );
  await transition(r.claimId!, "REPAIR_SUBMITTED");
  await as(inspector);
  await transition(r.claimId!, "VERIFIED", "Ремонт принят");
  const q = await db.query<{ status: string; verified_at: string }>(
    "select status,verified_at from warranty_claims where id=$1",
    [r.claimId],
  );
  assert.equal(q.rows[0].status, "VERIFIED");
  assert.ok(q.rows[0].verified_at);
});
test("contractor cannot bypass state machine with direct table update", async () => {
  await as(contractor);
  await db.exec("set role authenticated");
  try {
    await assert.rejects(
      db.query("update warranty_claims set status='VERIFIED'"),
      /permission denied/i,
    );
  } finally {
    await db.exec("reset role");
  }
});
test("overdue derives from server time and completed claims stop accruing overdue", async () => {
  const q = await db.query(
    "select public.claim_sla('OPEN',now()-interval '1 day',now()+interval '3 days') as response,public.claim_sla('IN_PROGRESS',now()-interval '1 day',now()-interval '1 hour') as repair, public.claim_sla('VERIFIED',now()-interval '1 day',now()-interval '1 hour') as done",
  );
  assert.deepEqual(q.rows[0], {
    response: "OVERDUE",
    repair: "OVERDUE",
    done: "COMPLETED",
  });
});
test("unauthenticated requests fail, invalid category is rejected", async () => {
  await as("");
  await assert.rejects(report(), /authentication/i);
  await as(inspector);
  await assert.rejects(report(asset, "FAKE"), /category/i);
});
test("admin registry creates records; non-admin and inconsistent warranty rejected", async () => {
  await as(inspector);
  await assert.rejects(
    db.query("select public.save_registry('warranties',null,$1::jsonb)", [
      JSON.stringify({
        asset_id: asset,
        contractor_id: "30000000-0000-4000-8000-000000000001",
        starts_at: "2026-01-01",
        expires_at: "2025-01-01",
        terms: "Тест",
      }),
    ]),
    /admin|permission/i,
  );
  await as(admin);
  await assert.rejects(
    db.query("select public.save_registry('warranties',null,$1::jsonb)", [
      JSON.stringify({
        asset_id: asset,
        contractor_id: "30000000-0000-4000-8000-000000000001",
        starts_at: "2026-01-01",
        expires_at: "2025-01-01",
        terms: "Тест",
      }),
    ]),
    /date|check|warranty/i,
  );
  const r = await db.query<{ id: string }>(
    "select public.save_registry('contractors',null,$1::jsonb) as id",
    [
      JSON.stringify({
        name: "Новый демо-подрядчик",
        bin_or_demo_identifier: "DEMO-NEW",
        contact_name: "Диспетчер",
        contact_phone: "+7 700 000 00 00",
      }),
    ],
  );
  assert.ok(r.rows[0].id);
});
test("rejected repair needs a reason and a fresh photo before resubmission", async () => {
  await as(inspector);
  const r = await report();
  await as(contractor);
  await transition(r.claimId!, "ACKNOWLEDGED");
  await transition(r.claimId!, "IN_PROGRESS");
  const path = `${r.claimId}/${crypto.randomUUID()}.png`;
  await db.query(
    'insert into storage.objects(bucket_id,name,owner_id,metadata) values (\'claim-evidence\',$1,$2,\'{"mimetype":"image/png","size":100}\')',
    [path, contractor],
  );
  await db.query("select public.record_evidence($1,$2,'AFTER','Ремонт')", [
    r.claimId,
    path,
  ]);
  await transition(r.claimId!, "REPAIR_SUBMITTED");
  await as(inspector);
  await assert.rejects(transition(r.claimId!, "REJECTED", ""), /comment/i);
  await transition(r.claimId!, "REJECTED", "Утечка сохраняется");
  await as(contractor);
  await transition(r.claimId!, "IN_PROGRESS");
  await assert.rejects(transition(r.claimId!, "REPAIR_SUBMITTED"), /evidence/i);
});
test("cannot register an old unregistered upload as fresh evidence after rejection", async () => {
  await as(inspector);
  const r = await report();
  await as(contractor);
  await transition(r.claimId!, "ACKNOWLEDGED");
  await transition(r.claimId!, "IN_PROGRESS");
  const first = `${r.claimId}/${crypto.randomUUID()}.png`,
    stale = `${r.claimId}/${crypto.randomUUID()}.png`,
    fresh = `${r.claimId}/${crypto.randomUUID()}.png`;
  for (const path of [first, stale])
    await db.query(
      'insert into storage.objects(bucket_id,name,owner_id,metadata) values(\'claim-evidence\',$1,$2,\'{"size":100,"mimetype":"image/png"}\')',
      [path, contractor],
    );
  await db.query(
    "select public.record_evidence($1,$2,'AFTER','Первый ремонт')",
    [r.claimId, first],
  );
  await transition(r.claimId!, "REPAIR_SUBMITTED");
  await as(inspector);
  await transition(r.claimId!, "REJECTED", "Недостаточное качество");
  await as(contractor);
  await transition(r.claimId!, "IN_PROGRESS");
  await assert.rejects(
    db.query("select public.record_evidence($1,$2,'AFTER','Старое фото')", [
      r.claimId,
      stale,
    ]),
    /new upload|rejection/i,
  );
  await db.query(
    'insert into storage.objects(bucket_id,name,owner_id,metadata) values(\'claim-evidence\',$1,$2,\'{"size":100,"mimetype":"image/png"}\')',
    [fresh, contractor],
  );
  await db.query("select public.record_evidence($1,$2,'AFTER','Доработка')", [
    r.claimId,
    fresh,
  ]);
  await transition(r.claimId!, "REPAIR_SUBMITTED");
});
