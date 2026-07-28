import { supabase } from "@/lib/supabaseClient";

export type FinanceMetrics = {
  availableBalance: number;
  escrowBalance: number;
  pendingPayouts: number;
  fraudAlerts: number;
};

export async function getFinanceMetrics(): Promise<FinanceMetrics> {
  // =========================================
  // ACCOUNT BALANCES
  // =========================================

  const { data: balanceData } = await supabase
    .from("account_balances")
    .select("balance");

  const availableBalance =
    balanceData?.reduce(
      (sum, row) => sum + Number(row.balance),
      0
    ) || 0;

  // =========================================
  // ESCROW BALANCE
  // =========================================

  const { data: escrowData } = await supabase
    .from("ledger_entries")
    .select("amount")
    .eq("event_type", "ESCROW_HELD");

  const escrowBalance =
    escrowData?.reduce(
      (sum, row) => sum + Number(row.amount),
      0
    ) || 0;

  // =========================================
  // PENDING PAYOUTS
  // =========================================

  const { data: payoutData } = await supabase
    .from("ledger_entries")
    .select("amount")
    .eq("event_type", "PAYOUT_SENT")
    .eq("status", "pending");

  const pendingPayouts =
    payoutData?.reduce(
      (sum, row) => sum + Number(row.amount),
      0
    ) || 0;

  // =========================================
  // FRAUD ALERTS
  // =========================================

  const { count } = await supabase
    .from("ledger_entries")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("event_type", "FRAUD_FLAGGED");

  return {
    availableBalance,
    escrowBalance,
    pendingPayouts,
    fraudAlerts: count || 0,
  };
}