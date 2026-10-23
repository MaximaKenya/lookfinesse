/**
 * LookFinesse account trial.
 * This file is the only place the trial length is defined.
 * The signup trigger in supabase/migrations/032_account_trial.sql uses the same 30-day interval.
 */

export const TRIAL_DAYS = 30;

export const TRIAL_REMINDER_DAYS = [7, 3, 1] as const;

export type TrialReminderDay = (typeof TRIAL_REMINDER_DAYS)[number];

export const TRIAL_COPY = `Free for ${TRIAL_DAYS} days, no card needed`;

export const TRIAL_ENDED_COPY = "Trial ended, choose a plan";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function trialWindow(from: Date = new Date()): { trial_start: string; trial_end: string } {
  const start = new Date(from.getTime());
  const end = new Date(from.getTime());
  end.setUTCDate(end.getUTCDate() + TRIAL_DAYS);
  return { trial_start: start.toISOString(), trial_end: end.toISOString() };
}

export function daysRemaining(
  trialEnd: string | Date | null | undefined,
  now: Date = new Date()
): number {
  if (trialEnd == null || trialEnd === "") return 0;
  const end = trialEnd instanceof Date ? trialEnd : new Date(trialEnd);
  const endMs = end.getTime();
  if (Number.isNaN(endMs)) return 0;
  const diff = endMs - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / MS_PER_DAY);
}

export function daysRemainingLabel(days: number): string {
  const n = Math.max(0, Math.floor(days));
  return n === 1 ? "1 day remaining" : `${n} days remaining`;
}

/**
 * Writes stay open when the trial is still running, the end date is missing
 * (migration not applied yet), or the date cannot be parsed. Admins are
 * handled by the caller.
 */
export function trialAllowsWrite(input: {
  trialEnd: string | Date | null | undefined;
  now?: Date;
}): boolean {
  if (input.trialEnd == null || input.trialEnd === "") return true;
  const end = input.trialEnd instanceof Date ? input.trialEnd : new Date(input.trialEnd);
  if (Number.isNaN(end.getTime())) return true;
  return daysRemaining(end, input.now) > 0;
}

/**
 * Reminder windows are (next smaller milestone, this milestone].
 * 7 days: 4–7 left. 3 days: 2–3 left. 1 day: exactly 1 left.
 * A missed cron still sends the milestone for the window the account is in.
 * Already-sent milestones are skipped so the daily job is idempotent.
 */
export function dueReminderDays(
  daysLeft: number,
  alreadySent: readonly number[]
): TrialReminderDay[] {
  if (!Number.isFinite(daysLeft) || daysLeft <= 0) return [];
  const sent = new Set(alreadySent);
  const milestones = [...TRIAL_REMINDER_DAYS].sort((a, b) => b - a);
  const due: TrialReminderDay[] = [];
  for (let i = 0; i < milestones.length; i++) {
    const milestone = milestones[i];
    const floor = milestones[i + 1] ?? 0;
    if (daysLeft <= milestone && daysLeft > floor && !sent.has(milestone)) {
      due.push(milestone);
    }
  }
  return due;
}

export function extendTrialEnd(
  currentEnd: string | Date | null | undefined,
  days: number,
  now: Date = new Date()
): string {
  const extra = Number.isFinite(days) && days > 0 ? Math.floor(days) : TRIAL_DAYS;
  const current = currentEnd ? new Date(currentEnd) : new Date(now.getTime());
  const currentMs = current.getTime();
  const baseMs = Math.max(now.getTime(), Number.isNaN(currentMs) ? now.getTime() : currentMs);
  const end = new Date(baseMs);
  end.setUTCDate(end.getUTCDate() + extra);
  return end.toISOString();
}
