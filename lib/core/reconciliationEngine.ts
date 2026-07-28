import { supabase } from "@/lib/supabaseClient";
import { rebuildAccountBalance } from "./auditReplay";

export async function reconcileVendor(vendorId: string) {
  const { data: snapshot } = await supabase
    .from("account_snapshots")
    .select("*")
    .eq("account_id", vendorId)
    .single();

  const actual = await rebuildAccountBalance(vendorId);

  if (!snapshot || snapshot.balance !== actual) {
    console.warn("⚠️ Mismatch detected");

    await supabase.from("reconciliation_logs").insert({
      vendor_id: vendorId,
      expected: snapshot?.balance,
      actual,
    });

    // Auto-heal snapshot
    await supabase.from("account_snapshots").upsert({
      account_id: vendorId,
      balance: actual,
    });
  }

  return actual;
}