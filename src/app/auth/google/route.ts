import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeWorkspacePath } from "@/lib/auth-routing";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const next = safeWorkspacePath(request.nextUrl.searchParams.get("next"));
  const callback = new URL("/auth/callback", origin);
  if (next) callback.searchParams.set("next", next);

  try {
    const db = await createClient();
    const { data, error } = await db.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });
    if (error || !data.url) throw error ?? new Error("OAuth URL missing");
    return NextResponse.redirect(data.url);
  } catch {
    return NextResponse.redirect(new URL("/login?error=google", origin));
  }
}
