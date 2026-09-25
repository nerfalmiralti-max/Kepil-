import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { migrate } from "./migrations";

test("confirmed Auth users get least-privilege profiles; only admins can assign audited roles", async () => {
  const db = new PGlite();
  const admin = "00000000-0000-4000-8000-000000000101";
  const newcomer = "00000000-0000-4000-8000-000000000102";
  const org = "20000000-0000-4000-8000-000000000101";
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb not null default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,owner_id text,metadata jsonb,created_at timestamptz not null default now());
      alter table storage.objects enable row level security;
      grant usage on schema auth,storage to authenticated;
      grant select,insert,delete on storage.objects to authenticated;`);
    await migrate(db);
    await db.query(
      "insert into auth.users(id,email,email_confirmed_at) values($1,'admin@test.kz',now())",
      [admin],
    );
    await db.query(
      "insert into public.organizations(id,name,type) values($1,'Город','AKIMAT')",
      [org],
    );
    await db.query(
      "update public.profiles set role='ADMIN',organization_id=$2 where id=$1",
      [admin, org],
    );
    await db.query(
      "insert into auth.users(id,email,raw_user_meta_data) values($1,'new@test.kz',$2)",
      [newcomer, { full_name: "Новый пользователь", role: "ADMIN" }],
    );
    assert.equal(
      (await db.query("select id from public.profiles where id=$1", [newcomer]))
        .rows.length,
      0,
    );
    await db.query(
      "update auth.users set email_confirmed_at=now() where id=$1",
      [newcomer],
    );
    const profile = await db.query<{
      email: string;
      full_name: string;
      role: string;
      organization_id: string | null;
    }>(
      "select email,full_name,role,organization_id from public.profiles where id=$1",
      [newcomer],
    );
    assert.deepEqual(profile.rows[0], {
      email: "new@test.kz",
      full_name: "Новый пользователь",
      role: "USER",
      organization_id: null,
    });
    await db.query("update auth.users set raw_user_meta_data=$2 where id=$1", [
      newcomer,
      { role: "ADMIN" },
    ]);
    assert.equal(
      (
        await db.query<{ role: string }>(
          "select role from public.profiles where id=$1",
          [newcomer],
        )
      ).rows[0].role,
      "USER",
    );
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      newcomer,
    ]);
    assert.equal(
      (await db.query("select id from public.organizations")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select id from public.profiles")).rows.length,
      1,
    );
    await assert.rejects(
      db.query(
        "select public.submit_defect($1,'WATER_LEAK','HIGH','Новый дефект','Описание повреждения водопровода.', $2)",
        [crypto.randomUUID(), crypto.randomUUID()],
      ),
      /inspector required/i,
    );
    await assert.rejects(
      db.query("select public.assign_user_role($1,'ADMIN',$2)", [
        newcomer,
        org,
      ]),
      /admin required/i,
    );
    await assert.rejects(
      db.query("update public.profiles set role='ADMIN' where id=$1", [
        newcomer,
      ]),
      /permission/i,
    );
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      admin,
    ]);
    await assert.rejects(
      db.query("select public.assign_user_role($1,'INSPECTOR',$2)", [
        admin,
        org,
      ]),
      /your own role/i,
    );
    await db.query("select public.assign_user_role($1,'INSPECTOR',$2)", [
      newcomer,
      org,
    ]);
    assert.equal(
      (
        await db.query<{ role: string }>(
          "select role from public.profiles where id=$1",
          [newcomer],
        )
      ).rows[0].role,
      "INSPECTOR",
    );
    assert.equal(
      (
        await db.query<{ action: string }>(
          "select action from public.audit_logs where entity_id=$1",
          [newcomer],
        )
      ).rows[0].action,
      "PROFILE_ROLE_CHANGED",
    );
    await db.query("select public.assign_user_role($1,'USER',null)", [
      newcomer,
    ]);
    assert.equal(
      (
        await db.query<{ organization_id: string | null }>(
          "select organization_id from public.profiles where id=$1",
          [newcomer],
        )
      ).rows[0].organization_id,
      null,
    );
  } finally {
    await db.close();
  }
});
