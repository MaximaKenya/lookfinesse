import { Resend } from "resend";
import { TRIAL_COPY, daysRemainingLabel } from "@/lib/config/trial";
import { emailLockupHtml, siteOrigin } from "@/lib/brand/emailLockup";

let client: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

export function trialReminderHtml(input: {
  displayName: string;
  daysLeft: number;
  origin?: string | null;
}): string {
  const name = escapeHtml(input.displayName || "there");
  const label = escapeHtml(daysRemainingLabel(input.daysLeft));
  const origin = (input.origin ?? siteOrigin()).replace(/\/$/, "");
  const href = origin ? `${origin}/trial` : "/trial";
  return `
    <div style="background:#FAF7F4;padding:28px;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:#1C1016">
      ${emailLockupHtml(origin)}
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#8A6A4F">LookFinesse trial</p>
      <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2">${label}</h1>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.5">Hi ${name}, your free LookFinesse trial is still open.</p>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.5">${escapeHtml(TRIAL_COPY)}.</p>
      <a href="${escapeHtml(href)}" style="display:inline-block;background:#1C1016;color:#FAF7F4;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:650">View your trial</a>
    </div>
  `;
}

export async function sendTrialReminderEmail(input: {
  to: string;
  displayName: string;
  daysLeft: number;
  userId: string;
  trialEnd: string;
}): Promise<{ sent: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) return { sent: false, error: "RESEND_API_KEY unset" };

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "LookFinesse <onboarding@resend.dev>";
  const label = daysRemainingLabel(input.daysLeft);
  const { error } = await resend.emails.send(
    {
      from,
      to: [input.to],
      subject: `${label} on LookFinesse`,
      html: trialReminderHtml({ displayName: input.displayName, daysLeft: input.daysLeft }),
    },
    {
      idempotencyKey: `trial-reminder/${input.userId}/${input.daysLeft}/${input.trialEnd}`,
    }
  );

  if (error) return { sent: false, error: error.message };
  return { sent: true };
}
