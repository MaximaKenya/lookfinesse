import { isPaystackConfigured, newPaystackReference } from "@/lib/paystack/client";

function authHeader() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

function toLocalMsisdn(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length >= 12) return `0${digits.slice(3)}`;
  if (digits.startsWith("0")) return digits;
  if (digits.length === 9) return `0${digits}`;
  return digits;
}

/**
 * Send a KES payout via Paystack Transfers (test mode until live keys are set).
 * Mobile money uses a Kenya MPESA recipient. Bank payouts pass bankCode.
 */
export async function sendPaystackPayout(input: {
  amountKes: number;
  phone?: string | null;
  accountNumber?: string | null;
  bankCode?: string | null;
  name?: string;
  reason?: string;
}): Promise<{ reference: string; transferCode?: string; status: string }> {
  if (!isPaystackConfigured()) {
    throw new Error("Paystack is not configured");
  }

  const amount = Math.round(Number(input.amountKes) * 100);
  if (!Number.isFinite(amount) || amount < 100) {
    throw new Error("Payout amount is too small");
  }

  const useBank = Boolean(input.accountNumber && input.bankCode);
  const recipientBody = useBank
    ? {
        type: "kepss",
        name: input.name || "LookFinesse vendor",
        account_number: input.accountNumber,
        bank_code: input.bankCode,
        currency: "KES",
      }
    : {
        type: "mobile_money",
        name: input.name || "LookFinesse vendor",
        account_number: toLocalMsisdn(input.phone || ""),
        bank_code: "MPESA",
        currency: "KES",
      };

  if (!useBank && recipientBody.account_number.length < 10) {
    throw new Error("Vendor mobile money number is missing");
  }

  const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(recipientBody),
  });
  const recipientJson = (await recipientRes.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: { recipient_code?: string };
  };
  if (!recipientRes.ok || !recipientJson.data?.recipient_code) {
    throw new Error(recipientJson.message || "Could not create a Paystack recipient");
  }

  const reference = newPaystackReference();
  const transferRes = await fetch("https://api.paystack.co/transfer", {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({
      source: "balance",
      amount,
      recipient: recipientJson.data.recipient_code,
      reason: input.reason || "LookFinesse vendor payout",
      currency: "KES",
      reference,
    }),
  });
  const transferJson = (await transferRes.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: { transfer_code?: string; status?: string; reference?: string };
  };
  if (!transferRes.ok || transferJson.status === false) {
    throw new Error(transferJson.message || "Paystack transfer failed");
  }

  return {
    reference: transferJson.data?.reference || reference,
    transferCode: transferJson.data?.transfer_code,
    status: transferJson.data?.status || "pending",
  };
}
