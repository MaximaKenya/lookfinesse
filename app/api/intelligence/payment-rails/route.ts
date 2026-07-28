import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ data: ledger }, { count: failedCount }] = await Promise.all([
    supabase
      .from("ledger_entries")
      .select("payment_method, status, amount, created_at")
      .gte("created_at", since),
    supabase
      .from("ledger_entries")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", since),
  ]);

  const rails = [
    { rail: "M-Pesa STK", key: "mpesa" },
    { rail: "Stripe Cards", key: "stripe" },
    { rail: "Bank Transfer", key: "bank" },
  ];

  const total = ledger?.length ?? 0;
  const failed = failedCount ?? 0;
  const failureRate = total > 0 ? failed / total : 0;

  const results = rails.map(({ rail, key }) => {
    const methodRows =
      ledger?.filter((row) =>
        String(row.payment_method ?? "")
          .toLowerCase()
          .includes(key)
      ) ?? [];

    const methodFailed = methodRows.filter(
      (row) => row.status === "failed"
    ).length;

    const rate =
      methodRows.length > 0 ? methodFailed / methodRows.length : failureRate;

    const status =
      rate >= 0.15
        ? "Degraded"
        : rate >= 0.05
          ? "Elevated Latency"
          : total === 0
            ? "No Traffic"
            : "Healthy";

    return { rail, status };
  });

  return NextResponse.json({
    rails: results,
    empty: total === 0,
  });
}
