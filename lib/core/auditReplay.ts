import { supabase } from "@/lib/supabaseClient";

export async function rebuildAccountBalance(accountId: string) {
  const { data: entries } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("account_id", accountId);

  let balance = 0;

  for (const e of entries || []) {
    if (e.type === "credit") balance += Number(e.amount);
    if (e.type === "debit") balance -= Number(e.amount);
  }

  // write snapshot
  await supabase
    .from("account_snapshots")
    .upsert({
      account_id: accountId,
      balance,
      updated_at: new Date().toISOString(),
    });

  return balance;
}