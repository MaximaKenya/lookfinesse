import { PayoutProvider } from "./types";

export async function payoutProviderFactory(
  provider: PayoutProvider,
  payload: any
) {
  switch (provider) {
    case "mpesa":
      return await mpesaPayout(payload);

    case "stripe_connect":
      return await stripePayout(payload);

    default:
      throw new Error("Unsupported provider");
  }
}

export async function mpesaPayout(payload: any) {
  // call your existing B2C logic
  return { status: "sent_mpesa", payload };
}

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export async function stripePayout(payload: any) {
  const transfer = await stripe.transfers.create({
    amount: Math.round(payload.amount * 100),
    currency: "kes",
    destination: payload.stripe_account_id,
  });

  return { status: "sent_stripe", transfer };
}