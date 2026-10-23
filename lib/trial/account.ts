import type { SupabaseClient } from "@supabase/supabase-js";
import { trialWindow } from "@/lib/config/trial";
import { createSupabaseServiceRole } from "@/lib/supabase/serviceRole";

export type AccountTrialRow = {
  trial_start: string | null;
  trial_end: string | null;
  display_name: string | null;
};

/**
 * Fill trial dates when a profile exists without them.
 * The auth.users trigger covers a normal signup. This covers backfill gaps
 * and profiles created before the migration. Service role is required because
 * users cannot edit their own trial columns.
 */
export async function ensureAccountTrial(userId: string): Promise<AccountTrialRow | null> {
  const db = createSupabaseServiceRole();
  if (!db) return null;

  const { data: existing } = await db
    .from("user_profiles")
    .select("trial_start, trial_end, display_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.trial_start && existing?.trial_end) {
    return existing as AccountTrialRow;
  }

  const window = trialWindow();
  if (!existing) {
    const { data: inserted } = await db
      .from("user_profiles")
      .insert({
        user_id: userId,
        trial_start: window.trial_start,
        trial_end: window.trial_end,
      })
      .select("trial_start, trial_end, display_name")
      .maybeSingle();
    return (inserted as AccountTrialRow | null) ?? null;
  }

  const { data: updated } = await db
    .from("user_profiles")
    .update({
      trial_start: existing.trial_start ?? window.trial_start,
      trial_end: existing.trial_end ?? window.trial_end,
    })
    .eq("user_id", userId)
    .select("trial_start, trial_end, display_name")
    .maybeSingle();

  return (updated as AccountTrialRow | null) ?? (existing as AccountTrialRow);
}

export async function readAccountTrial(
  supabase: SupabaseClient,
  userId: string
): Promise<AccountTrialRow | null> {
  const ensured = await ensureAccountTrial(userId);
  if (ensured?.trial_end) return ensured;

  const { data } = await supabase
    .from("user_profiles")
    .select("trial_start, trial_end, display_name")
    .eq("user_id", userId)
    .maybeSingle();

  return (data as AccountTrialRow | null) ?? ensured;
}
