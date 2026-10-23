import { NextResponse } from "next/server";
import {
  TRIAL_COPY,
  TRIAL_ENDED_COPY,
  daysRemaining,
} from "@/lib/config/trial";
import { paymentsEnabled } from "@/lib/config/payments";
import { isPlatformAdmin } from "@/lib/auth/platformAdmin";
import { readAccountTrial } from "@/lib/trial/account";
import { createSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = {
    paymentsEnabled: paymentsEnabled(),
    copy: TRIAL_COPY,
    endedCopy: TRIAL_ENDED_COPY,
  };

  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        ...base,
        authenticated: false,
        isAdmin: false,
        daysRemaining: null,
        active: false,
        trialStart: null,
        trialEnd: null,
      });
    }

    const profile = await readAccountTrial(supabase, user.id);
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const admin = isPlatformAdmin({
      email: user.email,
      roles: (roleRows ?? []).map((row: { role: string }) => row.role),
      appMetadata: (user.app_metadata ?? null) as Record<string, unknown> | null,
    });
    const trialEnd = profile?.trial_end ?? null;
    const remaining = trialEnd ? daysRemaining(trialEnd) : null;

    return NextResponse.json({
      ...base,
      authenticated: true,
      isAdmin: admin,
      daysRemaining: remaining,
      active: remaining == null ? true : remaining > 0,
      trialStart: profile?.trial_start ?? null,
      trialEnd,
    });
  } catch {
    return NextResponse.json({
      ...base,
      authenticated: false,
      isAdmin: false,
      daysRemaining: null,
      active: true,
      trialStart: null,
      trialEnd: null,
    });
  }
}
