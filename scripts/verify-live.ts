import assert from "node:assert/strict";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";

// Intentionally retains test claims and audit history in the DEMO project.
// Uses publishable key and normal account sessions, never a service-role bypass.
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    password = process.env.DEMO_PASSWORD;
  if (!url || !key || !password)
    throw new Error(
      "Configure Supabase URL, publishable key and DEMO_PASSWORD. Apply migrations and seed first.",
    );
  const clients: SupabaseClient[] = [];
  const login = async (email: string) => {
    const c = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await c.auth.signInWithPassword({ email, password });
    if (error) throw error;
    clients.push(c);
    return c;
  };
  const checked = async <T>(
    query: PromiseLike<{ data: T; error: { message: string } | null }>,
  ) => {
    const result = await query;
    if (result.error) throw new Error(result.error.message);
    if (result.data == null) throw new Error('Supabase returned no data; check migrations and demo seed.');
    return result.data;
  };
  try {
    const inspector = await login("inspector@kepil.demo"),
      contractor = await login("contractor@kepil.demo"),
      other = await login("lighting@kepil.demo");
    const asset = await checked(
      inspector
        .from("assets")
        .select("id")
        .eq("asset_code", "AKT-W-001")
        .single(),
    );
    const before = await checked(
      inspector.from("warranty_claims").select("id").eq("status", "VERIFIED"),
    );
    const input = {
      aid: asset.id,
      cat: "WATER_LEAK",
      sev: "HIGH",
      heading: "LIVE TEST · Утечка трубы",
      description_text:
        "Демонстрационный сквозной тест реального Supabase, Auth и Storage.",
      rid: crypto.randomUUID(),
    };
    const result = await checked(inspector.rpc("submit_defect", input));
    assert.equal(result.warrantyStatus, "ACTIVE");
    assert.ok(result.claimId);
    const repeatRequest = await checked(inspector.rpc("submit_defect", input));
    assert.equal(repeatRequest.claimId, result.claimId);
    const cid = result.claimId;
    assert.equal(
      (await checked(other.from("warranty_claims").select("id").eq("id", cid)))
        .length,
      0,
    );
    assert.ok(
      (
        await other.rpc("transition_claim", {
          cid,
          target: "ACKNOWLEDGED",
          comment_text: "",
        })
      ).error,
    );
    assert.ok(
      (
        await contractor.rpc("transition_claim", {
          cid,
          target: "VERIFIED",
          comment_text: "",
        })
      ).error,
    );
    await checked(
      contractor.rpc("transition_claim", {
        cid,
        target: "ACKNOWLEDGED",
        comment_text: "LIVE TEST",
      }),
    );
    await checked(
      contractor.rpc("transition_claim", {
        cid,
        target: "IN_PROGRESS",
        comment_text: "LIVE TEST",
      }),
    );
    assert.ok(
      (
        await contractor.rpc("transition_claim", {
          cid,
          target: "REPAIR_SUBMITTED",
          comment_text: "",
        })
      ).error,
    );
    const png = await sharp({
      create: { width: 320, height: 180, channels: 3, background: "#087e8b" },
    })
      .png()
      .toBuffer();
    const path = `${cid}/${crypto.randomUUID()}.png`;
    await checked(
      contractor.storage
        .from("claim-evidence")
        .upload(path, png, { contentType: "image/png", upsert: false }),
    );
    await checked(
      contractor.rpc("record_evidence", {
        cid,
        path,
        kind: "AFTER",
        note_text:
          "LIVE TEST: синтетическое тестовое изображение, не фотография муниципальных работ.",
      }),
    );
    const signed = await checked(
      inspector.storage.from("claim-evidence").createSignedUrl(path, 60),
    );
    const downloaded = await fetch(signed.signedUrl);
    assert.equal(downloaded.status, 200);
    assert.equal((await downloaded.arrayBuffer()).byteLength, png.length);
    assert.ok(
      (await other.storage.from("claim-evidence").createSignedUrl(path, 60))
        .error,
    );
    await checked(
      contractor.rpc("transition_claim", {
        cid,
        target: "REPAIR_SUBMITTED",
        comment_text: "LIVE TEST: ремонт отправлен",
      }),
    );
    await checked(
      inspector.rpc("transition_claim", {
        cid,
        target: "VERIFIED",
        comment_text: "LIVE TEST: проверка завершена",
      }),
    );
    const claim = await checked(
      inspector.from("claims_overview").select("*").eq("id", cid).single(),
    );
    assert.equal(claim.status, "VERIFIED");
    assert.equal(claim.sla_status, "COMPLETED");
    const history = await checked(
      inspector.from("status_history").select("to_status").eq("entity_id", cid),
    );
    for (const status of [
      "OPEN",
      "ACKNOWLEDGED",
      "IN_PROGRESS",
      "REPAIR_SUBMITTED",
      "VERIFIED",
    ])
      assert.ok(history.some((h) => h.to_status === status));
    const audit = await checked(
      inspector.from("audit_logs").select("action").eq("entity_id", cid),
    );
    assert.ok(audit.some((a) => a.action === "EVIDENCE_UPLOADED"));
    assert.ok(audit.some((a) => a.action === "VERIFICATION_APPROVED"));
    const after = await checked(
      inspector.from("warranty_claims").select("id").eq("status", "VERIFIED"),
    );
    assert.equal(after.length, before.length + 1);
    const repeat = await checked(
      inspector.rpc("submit_defect", { ...input, rid: crypto.randomUUID() }),
    );
    assert.equal(repeat.repeatDefect, true);
    assert.ok(repeat.previousDefectIds.includes(result.defectId));
    console.log(
      JSON.stringify(
        {
          status: "PASS",
          verifiedClaim: cid,
          repeatClaim: repeat.claimId,
          repeatCount: repeat.repeatCount,
          checked:
            "Auth, RPC, RLS, real Storage upload/download, state machine, audit, dashboard source, repeat detection",
        },
        null,
        2,
      ),
    );
  } finally {
    await Promise.allSettled(clients.map((c) => c.auth.signOut()));
  }
}
main().catch((error) => {
  console.error(`LIVE TEST FAILED: ${error.message}`);
  process.exitCode = 1;
});
