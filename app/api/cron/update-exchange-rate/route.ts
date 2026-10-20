import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { cronUnauthorized, isCronAuthorized } from "@/lib/cron/authorize";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return cronUnauthorized();

  try {
    const res = await fetch(
      "https://api.exchangerate.host/latest?base=KES&symbols=USD"
    );
    const data = await res.json().catch(() => null);
    const rate = data?.rates?.USD;

    if (typeof rate !== "number") {
      return NextResponse.json(
        { success: false, error: "Exchange rate unavailable" },
        { status: 502 }
      );
    }

    await supabase.from("exchange_rates").insert({
      usd_rate: rate,
    });

    return NextResponse.json({ success: true, rate });
  } catch (err) {
    console.error("[cron] update-exchange-rate", err);
    return NextResponse.json(
      { success: false, error: "Exchange rate job failed" },
      { status: 500 }
    );
  }
}
