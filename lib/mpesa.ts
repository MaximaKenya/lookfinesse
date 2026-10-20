function mpesaValue(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function isMpesaConfigured(): boolean {
  return Boolean(
    mpesaValue("MPESA_CONSUMER_KEY") &&
      mpesaValue("MPESA_CONSUMER_SECRET") &&
      mpesaValue("MPESA_SHORTCODE") &&
      mpesaValue("MPESA_PASSKEY")
  );
}

export async function getAccessToken() {
  const consumerKey = mpesaValue("MPESA_CONSUMER_KEY");
  const consumerSecret = mpesaValue("MPESA_CONSUMER_SECRET");
  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa is not configured");
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const res = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  const data = await res.json();
  return data.access_token as string | undefined;
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
  const shortcode = mpesaValue("MPESA_SHORTCODE");
  const passkey = mpesaValue("MPESA_PASSKEY");
  if (!shortcode || !passkey) {
    throw new Error("M-Pesa is not configured");
  }

  return Buffer.from(shortcode + passkey + timestamp).toString("base64");
}
