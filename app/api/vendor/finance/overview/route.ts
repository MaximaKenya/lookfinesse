import { NextResponse } from "next/server";

import { createSupabaseServer } from "@/lib/supabaseServer";
import { resolveVendorScope } from "@/lib/vendor/scope";

export const runtime = "nodejs";

type FinanceWallet = { id: string; currency: string; balance: number };
type FinancePayout = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
};
type FinanceRisk = {
  risk_score: number;
  trust_tier: string;
  is_frozen: boolean;
};
type FinanceKyc = { status: string };

function normalizeWallet(
  row: Record<string, unknown>,
  index: number
): FinanceWallet {
  return {
    id: String(row.id ?? row.wallet_id ?? `wallet-${index}`),
    currency: String(row.currency ?? "KES"),
    balance: Number(row.balance ?? 0),
  };
}

function normalizePayout(
  row: Record<string, unknown>,
  index: number
): FinancePayout {
  return {
    id: String(row.id ?? `payout-${index}`),
    amount: Number(row.amount ?? 0),
    status: String(row.status ?? "pending"),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function normalizeRisk(row: Record<string, unknown> | null): FinanceRisk {
  return {
    risk_score: Number(row?.risk_score ?? 0),
    trust_tier: String(row?.trust_tier ?? "STANDARD"),
    is_frozen: Boolean(row?.is_frozen ?? false),
  };
}

function normalizeKyc(row: Record<string, unknown> | null): FinanceKyc {
  const status = row?.status ?? row?.verification_status ?? "PENDING";
  return { status: String(status).toUpperCase() };
}

async function safeSelect<T>(
  query: PromiseLike<{ data: T | null; error: { message: string } | null }>
) {
  try {
    const { data, error } = await query;
    if (error) {
      console.warn("Vendor finance query skipped:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Vendor finance query failed:", err);
    return null;
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const scopeResult = await resolveVendorScope(supabase);

    if (!scopeResult.ok) {
      return NextResponse.json(
        {
          error:
            scopeResult.reason === "not_vendor"
              ? "Vendor account required"
              : "Unauthorized",
        },
        { status: scopeResult.reason === "not_vendor" ? 403 : 401 }
      );
    }

    const { vendorId } = scopeResult.scope;

    const [
      walletBalances,
      vendorWallets,
      payoutsFromQueue,
      payoutsFromTable,
      riskRow,
      kycRow,
      ledger,
    ] = await Promise.all([
      safeSelect(
        supabase.from("wallet_balances").select("*").eq("vendor_id", vendorId)
      ),
      safeSelect(
        supabase.from("vendor_wallets").select("*").eq("vendor_id", vendorId)
      ),
      safeSelect(
        supabase
          .from("payout_queue")
          .select("*")
          .eq("vendor_id", vendorId)
          .order("created_at", { ascending: false })
          .limit(20)
      ),
      safeSelect(
        supabase
          .from("payouts")
          .select("*")
          .eq("vendor_id", vendorId)
          .order("created_at", { ascending: false })
          .limit(20)
      ),
      safeSelect(
        supabase
          .from("vendor_risk_scores")
          .select("*")
          .eq("vendor_id", vendorId)
          .maybeSingle()
      ),
      safeSelect(
        supabase
          .from("vendor_kyc")
          .select("*")
          .eq("vendor_id", vendorId)
          .maybeSingle()
      ),
      safeSelect(
        supabase
          .from("ledger_entries")
          .select("type, amount")
          .eq("vendor_id", vendorId)
      ),
    ]);

    let wallets: FinanceWallet[] = [
      ...(walletBalances ?? []).map((row, index) =>
        normalizeWallet(row as Record<string, unknown>, index)
      ),
    ];

    if (wallets.length === 0 && vendorWallets && vendorWallets.length > 0) {
      wallets = vendorWallets.map((row, index) =>
        normalizeWallet(row as Record<string, unknown>, index)
      );
    }

    if (wallets.length === 0 && ledger && ledger.length > 0) {
      const balance = ledger.reduce((acc, row) => {
        return row.type === "credit"
          ? acc + Number(row.amount ?? 0)
          : acc - Number(row.amount ?? 0);
      }, 0);
      wallets = [
        {
          id: "ledger-kes",
          currency: "KES",
          balance: Math.max(0, balance),
        },
      ];
    }

    const payoutRows =
      payoutsFromQueue && payoutsFromQueue.length > 0
        ? payoutsFromQueue
        : (payoutsFromTable ?? []);

    const payouts = payoutRows.map((row, index) =>
      normalizePayout(row as Record<string, unknown>, index)
    );

    const risk = normalizeRisk(
      (riskRow as Record<string, unknown> | null) ?? null
    );
    const kyc = normalizeKyc((kycRow as Record<string, unknown> | null) ?? null);

    return NextResponse.json({
      demo: false,
      empty: wallets.length === 0 && payouts.length === 0,
      label:
        wallets.length === 0 && payouts.length === 0
          ? "No finance records yet — complete your first sale to see balances here"
          : undefined,
      wallets,
      payouts,
      risk,
      kyc,
    });
  } catch (err) {
    console.error("Vendor finance overview failed:", err);
    return NextResponse.json(
      { error: "Failed to load finance overview" },
      { status: 500 }
    );
  }
}
