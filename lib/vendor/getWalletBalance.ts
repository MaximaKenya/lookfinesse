import type { SupabaseClient } from "@supabase/supabase-js";

/** Sum vendor wallet + escrow balance in KES. */
export async function getVendorWalletBalance(
  supabase: SupabaseClient,
  vendorId: string
): Promise<number> {
  const [walletRes, ledgerRes] = await Promise.allSettled([
    supabase.from("wallet_balances").select("balance").eq("vendor_id", vendorId),
    supabase.from("vendor_wallets").select("balance").eq("vendor_id", vendorId),
  ]);

  let total = 0;

  if (walletRes.status === "fulfilled" && walletRes.value.data?.length) {
    total += walletRes.value.data.reduce(
      (s, r) => s + Number((r as { balance?: number }).balance ?? 0),
      0
    );
  }

  if (total === 0 && ledgerRes.status === "fulfilled" && ledgerRes.value.data?.length) {
    total += ledgerRes.value.data.reduce(
      (s, r) => s + Number((r as { balance?: number }).balance ?? 0),
      0
    );
  }

  if (total === 0) {
    const { data: ledger } = await supabase
      .from("ledger_entries")
      .select("type, amount")
      .eq("vendor_id", vendorId);

    if (ledger?.length) {
      total = ledger.reduce((acc, row) => {
        return row.type === "credit"
          ? acc + Number(row.amount ?? 0)
          : acc - Number(row.amount ?? 0);
      }, 0);
    }
  }

  return Math.max(0, total);
}
