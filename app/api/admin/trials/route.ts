import { NextResponse } from "next/server";
import { z } from "zod";
import { TRIAL_DAYS, daysRemaining, extendTrialEnd } from "@/lib/config/trial";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["extend", "end"]),
  days: z.number().int().min(1).max(365).optional(),
});

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { data, error } = await gate.ctx.db.rpc("trial_admin_roster");
  if (error) {
    return NextResponse.json(
      { error: "Trial roster is unavailable. Apply supabase/migrations/032_account_trial.sql." },
      { status: 503 }
    );
  }

  const accounts = (data ?? []).map((row: {
    user_id: string;
    email: string | null;
    display_name: string | null;
    trial_start: string | null;
    trial_end: string | null;
    roles: string | null;
  }) => ({
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    trialStart: row.trial_start,
    trialEnd: row.trial_end,
    roles: row.roles,
    daysRemaining: row.trial_end ? daysRemaining(row.trial_end) : null,
    active: row.trial_end ? daysRemaining(row.trial_end) > 0 : false,
  }));

  return NextResponse.json({ accounts });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the account and action." }, { status: 400 });
  }

  const { userId, action } = parsed.data;
  const days = parsed.data.days ?? TRIAL_DAYS;
  const db = gate.ctx.db;

  const { data: profile, error: readError } = await db
    .from("user_profiles")
    .select("user_id, trial_start, trial_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) {
    return NextResponse.json({ error: "Could not read that account." }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const previousEnd = profile.trial_end as string | null;
  const nextEnd =
    action === "end"
      ? new Date(Date.now() - 1000).toISOString()
      : extendTrialEnd(previousEnd, days);

  const { error: updateError } = await db
    .from("user_profiles")
    .update({ trial_end: nextEnd, trial_start: profile.trial_start ?? new Date().toISOString() })
    .eq("user_id", userId);

  if (updateError) {
    return NextResponse.json({ error: "Could not update the trial." }, { status: 500 });
  }

  const { error: auditError } = await db.from("audit_logs").insert({
    action: action === "end" ? "trial.end" : "trial.extend",
    table_name: "user_profiles",
    record_id: userId,
    actor_id: gate.ctx.user.id,
    metadata: {
      days: action === "extend" ? days : 0,
      previous_trial_end: previousEnd,
      trial_end: nextEnd,
    },
  });

  if (auditError) {
    await db
      .from("user_profiles")
      .update({ trial_end: previousEnd })
      .eq("user_id", userId);
    return NextResponse.json({ error: "Audit log failed. Trial was left unchanged." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    userId,
    action,
    trialEnd: nextEnd,
    daysRemaining: daysRemaining(nextEnd),
  });
}
