import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getRequestOrigin } from "@/lib/url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-03-25.dahlia" as any,
  });

  const { vendor_id, email } = await req.json();
  const origin = getRequestOrigin(req);

  // 1. CREATE CONNECT ACCOUNT
  const account = await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      transfers: { requested: true },
    },
  });

  // 2. CREATE ONBOARDING LINK
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${origin}/dashboard/vendor/onboarding`,
    return_url: `${origin}/dashboard/vendor`,
    type: "account_onboarding",
  });

  // 3. SAVE TO DB
  await supabase
    .from("vendors")
    .update({ stripe_account_id: account.id })
    .eq("id", vendor_id);

  return NextResponse.json({ url: accountLink.url });
}