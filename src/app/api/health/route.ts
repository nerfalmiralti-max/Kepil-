import { NextResponse } from "next/server";
import { configured } from "@/lib/supabase/server";
export async function GET() {
  return NextResponse.json(
    {
      app: "KEPIL",
      status: configured() ? "configured" : "setup_required",
      databaseConnectionVerified: false,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
