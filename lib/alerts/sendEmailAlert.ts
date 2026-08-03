import { Resend } from "resend";

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
      <h2>Critical Alert</h2>
      <p>Type: ${type}</p>
      <pre>${JSON.stringify(payload, null, 2)}</pre>
    `,
  });
}
