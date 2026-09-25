import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { defaultWorkspace, safeWorkspacePath } from "@/lib/auth-routing";
import type { Profile } from "@/lib/types";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  if (request.nextUrl.searchParams.has("error")) {
    const cancelled =
      request.nextUrl.searchParams.get("error") === "access_denied";
    return NextResponse.redirect(
      new URL(
        cancelled ? "/login?error=cancelled" : "/login?error=google",
        origin,
      ),
    );
  }
  if (!code)
    return NextResponse.redirect(new URL("/login?error=callback", origin));

  try {
    const db = await createClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (error) throw error;
    const {
      data: { user },
      error: userError,
    } = await db.auth.getUser();
    if (userError || !user) throw userError ?? new Error("No session");

    // The database profile is the sole source of role and organization.
    let { data } = await db
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (!data) {
      const { error: ensureError } = await db.rpc("ensure_own_profile");
      if (ensureError) throw ensureError;
      ({ data } = await db
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle());
    }
    const profile = data as Profile | null;
    if (
      !profile ||
      !["USER", "ADMIN", "INSPECTOR", "CONTRACTOR"].includes(profile.role)
    ) {
      return NextResponse.redirect(
        new URL("/access-pending?provider=google", origin),
      );
    }
    if (profile.role !== "USER") {
      if (!profile.organization_id)
        return NextResponse.redirect(
          new URL("/access-pending?provider=google", origin),
        );
      const { data: organization } = await db
        .from("organizations")
        .select("id")
        .eq("id", profile.organization_id)
        .maybeSingle();
      if (!organization)
        return NextResponse.redirect(
          new URL("/access-pending?provider=google", origin),
        );
    }

    const next = safeWorkspacePath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(
      new URL(
        profile.role === "USER"
          ? "/account"
          : (next ?? defaultWorkspace(profile.role)),
        origin,
      ),
    );
  } catch {
    return NextResponse.redirect(new URL("/login?error=callback", origin));
  }
}
