const consumerKey = process.env.MPESA_CONSUMER_KEY!;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;

export async function getAccessToken() {
  const auth = Buffer.from(
    `${consumerKey}:${consumerSecret}`
  ).toString("base64");

  const res = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  const data = await res.json();
  return data.access_token;
}

export function getTimestamp() {
  const date = new Date();

  return (
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0") +
    String(date.getHours()).padStart(2, "0") +
    String(date.getMinutes()).padStart(2, "0") +
    String(date.getSeconds()).padStart(2, "0")
  );
}

export function generatePassword(timestamp: string) {
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;

  return Buffer.from(shortcode + passkey + timestamp).toString("base64");
}