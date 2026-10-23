import { NextResponse } from "next/server";
import { TRIAL_ENDED_COPY, trialAllowsWrite } from "@/lib/config/trial";
import { isPlatformAdmin } from "@/lib/auth/platformAdmin";
import { createSupabaseServer } from "@/lib/supabaseServer";

/**
 * Block a new paid/write action after the trial ends.
 * Read access and edits to existing rows are not passed through here.
 * Missing dates, auth errors, and admins are allowed so nobody is locked
 * out of content we cannot confidently gate.
 */
export async function blockIfTrialEnded(): Promise<NextResponse | null> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const admin = isPlatformAdmin({
      email: user.email,
      roles: (roleRows ?? []).map((row: { role: string }) => row.role),
      appMetadata: (user.app_metadata ?? null) as Record<string, unknown> | null,
    });
    if (admin) return null;

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("trial_end")
      .eq("user_id", user.id)
      .maybeSingle();

    if (trialAllowsWrite({ trialEnd: profile?.trial_end ?? null })) return null;

    return NextResponse.json(
      {
        error: TRIAL_ENDED_COPY,
        code: "TRIAL_ENDED",
        href: "/trial",
      },
      { status: 403 }
    );
  } catch {
    return null;
  }
}
