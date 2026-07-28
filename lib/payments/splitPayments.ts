import { supabase } from "@/lib/supabaseClient";

export type Split = {
  vendor_id: string;
  amount: number;
};

export async function splitPayments(
  splits: Split[],
  orderId: string
) {
  if (!splits || splits.length === 0) return;

  const ledgerEntries = splits.map((s) => ({
    vendor_id: s.vendor_id,
    amount: s.amount,
    type: "credit",
    category: "sale",
    reference_id: orderId,
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("ledger_entries")
    .insert(ledgerEntries);

  if (error) {
    console.error("Split payment error:", error);
    throw new Error("Failed to split payment");
  }

  return { success: true };
}