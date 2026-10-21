import { Resend } from "resend";
import { emailLockupHtml, siteOrigin } from "@/lib/brand/emailLockup";

let client: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export async function sendEmailAlert(
  type: string,
  payload: any
) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY unset — skipping email alert:", type);
    return;
  }

  await resend.emails.send({
    from: "alerts@yourdomain.com",
    to: ["admin@yourdomain.com"],
    subject: `🚨 ${type} detected`,
    html: `
      <div style="background:#FAF7F4;padding:24px;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:#1C1016">
        ${emailLockupHtml(siteOrigin())}
        <h2 style="margin:0 0 8px;font-size:20px">Critical alert</h2>
        <p style="margin:0 0 12px">Type: ${type}</p>
        <pre style="background:#fff;border:1px solid #E7D5C8;border-radius:12px;padding:12px;overflow:auto">${JSON.stringify(payload, null, 2)}</pre>
      </div>
    `,
  });
}
