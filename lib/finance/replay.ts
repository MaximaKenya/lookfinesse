import { supabase } from "@/lib/supabaseClient";

export async function replayUserBalance(userId: string) {
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("created_at", { ascending: true });

  if (error) throw error;

  let balance = 0;

  for (const entry of data || []) {
    if (entry.direction === "credit") {
      balance += Number(entry.amount);
    } else {
      balance -= Number(entry.amount);
    }
  }

  return balance;
}