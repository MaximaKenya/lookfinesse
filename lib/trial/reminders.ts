import {
  daysRemaining,
  daysRemainingLabel,
  dueReminderDays,
  TRIAL_COPY,
  type TrialReminderDay,
} from "@/lib/config/trial";
import { createSupabaseServiceRole } from "@/lib/supabase/serviceRole";
import { sendTrialReminderEmail } from "@/lib/trial/email";

type Candidate = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  trial_start: string | null;
  trial_end: string;
};

type ReminderRow = {
  user_id: string;
  days_before: number;
  trial_end: string;
  email_sent_at: string | null;
  in_app_sent_at: string | null;
};

export type TrialReminderRun = {
  ok: boolean;
  checked: number;
  sent: number;
  skipped: number;
  reason?: string;
};

function sameInstant(a: string, b: string): boolean {
  const left = new Date(a).getTime();
  const right = new Date(b).getTime();
  return Number.isFinite(left) && left === right;
}

/**
 * Daily, idempotent 7 / 3 / 1 day reminders.
 * A row in trial_reminders claims the milestone for that trial_end.
 * Email and in-app are tracked separately so a failed send retries next run.
 */
export async function runTrialReminders(now: Date = new Date()): Promise<TrialReminderRun> {
  const db = createSupabaseServiceRole();
  if (!db) {
    return { ok: false, checked: 0, sent: 0, skipped: 0, reason: "service_role_missing" };
  }

  const { data: candidates, error } = await db.rpc("trial_accounts_in_reminder_window", {
    p_now: now.toISOString(),
  });

  if (error) {
    console.error("[trial reminders]", error.message);
    return { ok: false, checked: 0, sent: 0, skipped: 0, reason: error.message };
  }

  const rows = (candidates ?? []) as Candidate[];
  if (rows.length === 0) {
    return { ok: true, checked: 0, sent: 0, skipped: 0 };
  }

  const userIds = rows.map((row) => row.user_id);
  const { data: existing } = await db
    .from("trial_reminders")
    .select("user_id, days_before, trial_end, email_sent_at, in_app_sent_at")
    .in("user_id", userIds);

  const sentRows = (existing ?? []) as ReminderRow[];
  let sent = 0;
  let skipped = 0;

  for (const account of rows.slice(0, 200)) {
    const daysLeft = daysRemaining(account.trial_end, now);
    const prior = sentRows.filter(
      (row) => row.user_id === account.user_id && sameInstant(row.trial_end, account.trial_end)
    );
    const due = dueReminderDays(
      daysLeft,
      prior.map((row) => row.days_before)
    );
    if (due.length === 0) {
      skipped += 1;
      continue;
    }

    for (const milestone of due) {
      const delivered = await deliverMilestone(db, account, milestone, daysLeft, prior);
      if (delivered) sent += 1;
    }
  }

  return { ok: true, checked: rows.length, sent, skipped };
}

async function deliverMilestone(
  db: NonNullable<ReturnType<typeof createSupabaseServiceRole>>,
  account: Candidate,
  milestone: TrialReminderDay,
  daysLeft: number,
  prior: ReminderRow[]
): Promise<boolean> {
  let row = prior.find((item) => item.days_before === milestone);
  if (!row) {
    const { data: inserted, error } = await db
      .from("trial_reminders")
      .insert({
        user_id: account.user_id,
        days_before: milestone,
        trial_end: account.trial_end,
      })
      .select("user_id, days_before, trial_end, email_sent_at, in_app_sent_at")
      .maybeSingle();

    if (error && error.code !== "23505") {
      console.error("[trial reminders] insert", error.message);
      return false;
    }
    row =
      (inserted as ReminderRow | null) ??
      ({
        user_id: account.user_id,
        days_before: milestone,
        trial_end: account.trial_end,
        email_sent_at: null,
        in_app_sent_at: null,
      } satisfies ReminderRow);
    prior.push(row);
  }

  const label = daysRemainingLabel(daysLeft);
  let changed = false;

  if (!row.in_app_sent_at) {
    const { error: noteError } = await db.from("notifications").insert({
      user_id: account.user_id,
      type: "trial_reminder",
      title: label,
      message: `Your LookFinesse trial has ${label.toLowerCase()}. ${TRIAL_COPY}.`,
      link_url: "/trial",
      is_read: false,
    });
    if (!noteError) {
      row.in_app_sent_at = new Date().toISOString();
      changed = true;
    }
  }

  if (!row.email_sent_at && account.email) {
    const email = await sendTrialReminderEmail({
      to: account.email,
      displayName: account.display_name || "there",
      daysLeft,
      userId: account.user_id,
      trialEnd: account.trial_end,
    });
    if (email.sent) {
      row.email_sent_at = new Date().toISOString();
      changed = true;
    }
  }

  if (changed) {
    await db
      .from("trial_reminders")
      .update({
        in_app_sent_at: row.in_app_sent_at,
        email_sent_at: row.email_sent_at,
      })
      .eq("user_id", account.user_id)
      .eq("days_before", milestone)
      .eq("trial_end", account.trial_end);
  }

  return Boolean(row.in_app_sent_at || row.email_sent_at);
}
