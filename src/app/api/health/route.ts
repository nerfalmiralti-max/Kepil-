import { NextResponse } from "next/server";
import { configured, createClient } from "@/lib/supabase/server";
export async function GET() {
  let databaseConnectionVerified = false;
  if (configured()) {
    try {
      const db = await createClient();
      const { error } = await db.from("organizations").select("id").limit(1);
      // The anonymous role is intentionally denied table access. PostgreSQL
      // error 42501 still proves PostgREST reached the database.
      databaseConnectionVerified = !error || error.code === "42501";
    } catch {
      databaseConnectionVerified = false;
    }
  }
  return NextResponse.json(
    {
      app: "KEPIL",
      status: !configured()
        ? "setup_required"
        : databaseConnectionVerified
          ? "healthy"
          : "degraded",
      databaseConnectionVerified,
    },
    {
      status: databaseConnectionVerified || !configured() ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
