import { supabase } from "@/lib/supabaseClient";

export async function runReconciliation(vendorId: string) {
  const { data: ledger } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: true });

  const { data: balance } = await supabase
    .from("vendor_balances")
    .select("*")
    .eq("vendor_id", vendorId)
    .single();

  let computed = 0;

  for (const entry of ledger ?? []) {
    if (entry.type === "CREDIT") {
      computed += entry.amount;
    } else {
      computed -= entry.amount;
    }
  }

  const drift =
    computed - (balance?.available_balance ?? 0);

  return {
    computed_balance: computed,
    stored_balance: balance?.available_balance,
    drift,
    is_consistent: Math.abs(drift) < 0.01,
  };
}