import { supabase } from "@/lib/supabaseClient";

export function subscribeToFinanceUpdates(vendorId: string, callback: () => void) {
  return supabase
    .channel("finance-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ledger_entries" },
      callback
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "payouts" },
      callback
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "escrow_wallets" },
      callback
    )
    .subscribe();
}