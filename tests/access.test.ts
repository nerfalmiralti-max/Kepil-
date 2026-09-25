import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { migrate } from "./migrations";
import {
  demoAssets,
  demoContracts,
  demoContractors,
  demoOrganizations,
  demoWarranties,
  uid,
} from "../scripts/demo-data";

test("entire transactional workflow executes under authenticated role, including private storage access", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
 create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,owner_id text,metadata jsonb,created_at timestamptz not null default now()); alter table storage.objects enable row level security;
 grant usage on schema auth,storage to authenticated; grant select,insert,delete on storage.objects to authenticated;`);
    await migrate(db);
    for (const [table, rows] of [
      ["organizations", demoOrganizations],
      ["contractors", demoContractors],
      ["contracts", demoContracts],
      ["assets", demoAssets],
      ["warranties", demoWarranties],
    ] as const) {
      for (const row of rows) {
        const columns = Object.keys(row);
        await db.query(
          `insert into public.${table} (${columns.join(",")}) values (${columns.map((_, i) => `$${i + 1}`).join(",")})`,
          Object.values(row),
        );
      }
    }
    const admin = uid(1, 1),
      inspector = uid(1, 2),
      contractor = uid(1, 3),
      other = uid(1, 4);
    for (const [id, role, org] of [
      [admin, "ADMIN", uid(20, 1)],
      [inspector, "INSPECTOR", uid(20, 1)],
      [contractor, "CONTRACTOR", uid(20, 2)],
      [other, "CONTRACTOR", uid(20, 3)],
    ]) {
      await db.query("insert into auth.users values ($1)", [id]);
      await db.query(
        "insert into public.profiles(id,email,full_name,role,organization_id) values($1,$2,$3,$4,$5)",
        [id, `${role}-${id}@test.kz`, role, role, org],
      );
    }
    await db.exec("set role authenticated");
    const as = async (id: string) => {
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id,
      ]);
    };
    await as(inspector);
    const input = [
      uid(10, 1),
      "WATER_LEAK",
      "HIGH",
      "Новый дефект",
      "Обнаружена утечка водопровода.",
      crypto.randomUUID(),
    ];
    const r = await db.query<{
      result: { claimId: string; defectId: string; repeatDefect: boolean };
    }>("select public.submit_defect($1,$2,$3,$4,$5,$6) as result", input);
    const { claimId, defectId } = r.rows[0].result;
    assert.ok(claimId);
    await as(contractor);
    const views = await db.query(
      "select id from public.claims_overview where id=$1",
      [claimId],
    );
    assert.equal(views.rows.length, 1);
    await db.query("select public.transition_claim($1,'ACKNOWLEDGED','')", [
      claimId,
    ]);
    await db.query("select public.transition_claim($1,'IN_PROGRESS','')", [
      claimId,
    ]);
    const path = `${claimId}/${crypto.randomUUID()}.png`;
    await db.query(
      'insert into storage.objects(bucket_id,name,owner_id,metadata) values(\'claim-evidence\',$1,$2,\'{"size":100,"mimetype":"image/png"}\')',
      [path, contractor],
    );
    await db.query(
      "select public.record_evidence($1,$2,'AFTER','Результат ремонта')",
      [claimId, path],
    );
    await assert.rejects(
      db.query("select public.transition_claim($1,'VERIFIED','')", [claimId]),
      /permission/i,
    );
    await db.query(
      "select public.transition_claim($1,'REPAIR_SUBMITTED','Работы выполнены')",
      [claimId],
    );
    await as(other);
    for (const table of [
      "warranty_claims",
      "claim_evidence",
      "inspections",
      "status_history",
      "audit_logs",
    ]) {
      const key =
        table === "warranty_claims"
          ? "id"
          : table === "claim_evidence" || table === "inspections"
            ? "claim_id"
            : "entity_id";
      const rows = await db.query(
        `select * from public.${table} where ${key}=$1`,
        [claimId],
      );
      assert.equal(rows.rows.length, 0, `${table} must be isolated`);
    }
    assert.equal(
      (await db.query("select * from public.defects where id=$1", [defectId]))
        .rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from storage.objects where name=$1", [path]))
        .rows.length,
      0,
    );
    await assert.rejects(
      db.query(
        "insert into storage.objects(bucket_id,name,owner_id,metadata) values('claim-evidence',$1,$2,'{}')",
        [`${claimId}/other.png`, other],
      ),
      /row-level security/i,
    );
    await as(inspector);
    assert.equal(
      (await db.query("select * from storage.objects where name=$1", [path]))
        .rows.length,
      1,
    );
    await db.query(
      "select public.transition_claim($1,'VERIFIED','Осмотр проведён, замечаний нет')",
      [claimId],
    );
    assert.equal(
      (
        await db.query<{ status: string }>(
          "select status from public.warranty_claims where id=$1",
          [claimId],
        )
      ).rows[0].status,
      "VERIFIED",
    );
    await db.query("select public.refresh_sla()");
    await db.query("select public.mark_notifications_read()");
    await assert.rejects(
      db.query("update public.profiles set role='ADMIN' where id=auth.uid()"),
      /permission/i,
    );
    await assert.rejects(
      db.query(
        "select private.log_event(private.current_profile(),'FAKE','claim',$1,'{}')",
        [claimId],
      ),
      /permission/i,
    );
  } finally {
    await db.close();
  }
});
