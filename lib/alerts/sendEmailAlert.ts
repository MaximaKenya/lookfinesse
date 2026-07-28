import { Resend } from "resend";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

export async function sendEmailAlert(
  type: string,
  payload: any
) {
  await resend.emails.send({
    from: "alerts@yourdomain.com",

    to: ["admin@yourdomain.com"],

    subject: `🚨 ${type} detected`,

    html: `
      <h2>Critical Alert</h2>

      <p>Type: ${type}</p>

      <pre>${JSON.stringify(
        payload,
        null,
        2
      )}</pre>
    `,
  });
}