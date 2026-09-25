import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient, configured } from "./supabase/server";
import type { Dataset, Profile, Evidence } from "./types";

export const getProfile = cache(async (): Promise<Profile> => {
  if (!configured()) redirect("/setup");
  const db = await createClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) redirect("/login");
  const { data, error: profileError } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (profileError || !data) redirect("/login?error=profile");
  return data as Profile;
});

export const getDataset = cache(async (): Promise<Dataset> => {
  const profile = await getProfile();
  const db = await createClient();
  const { error: slaError } = await db.rpc("refresh_sla");
  if (slaError) throw new Error(`Не удалось обновить SLA: ${slaError.message}`);
  const names = [
    "assets",
    "contractors",
    "contracts",
    "warranties_overview",
    "defects",
    "claims_overview",
    "status_history",
    "audit_logs",
    "notifications",
  ] as const;
  // Fetch all visible rows in pages so dashboard totals never silently stop at PostgREST's row limit.
  const rows = await Promise.all(
    names.map(async (name) => {
      const result = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await db
          .from(name)
          .select("*")
          .order("created_at", { ascending: false })
          .order("id")
          .range(offset, offset + 999);
        if (error)
          throw new Error(`Не удалось прочитать ${name}: ${error.message}`);
        result.push(...data);
        if (data.length < 1000) break;
      }
      return result;
    }),
  );
  const { data: today, error } = await db.rpc("server_today");
  if (error) throw new Error("Не удалось получить дату сервера");
  return {
    profile,
    assets: rows[0],
    contractors: rows[1],
    contracts: rows[2],
    warranties: rows[3],
    defects: rows[4],
    claims: rows[5],
    history: rows[6],
    audit: rows[7],
    notifications: rows[8],
    today,
  } as Dataset;
});

export async function getEvidence(claimId: string): Promise<Evidence[]> {
  await getProfile();
  const db = await createClient();
  const { data, error } = await db
    .from("claim_evidence")
    .select("*")
    .eq("claim_id", claimId)
    .order("created_at");
  if (error) throw new Error("Не удалось загрузить подтверждения");
  return Promise.all(
    (data as Evidence[]).map(async (item) => {
      const { data: link } = await db.storage
        .from("claim-evidence")
        .createSignedUrl(item.storage_path, 600);
      return { ...item, url: link?.signedUrl };
    }),
  );
}
