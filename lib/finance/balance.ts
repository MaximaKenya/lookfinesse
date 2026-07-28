import { supabase } from "@/lib/supabaseClient";

export async function getVendorBalance(vendor_id: string) {
  const { data } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("vendor_id", vendor_id);

  let balance = 0;

  data?.forEach((l) => {
    if (l.type === "credit") balance += Number(l.amount);
    if (l.type === "debit") balance -= Number(l.amount);
  });

  return balance;
}