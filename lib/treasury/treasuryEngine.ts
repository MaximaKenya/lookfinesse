import { supabase } from "@/lib/supabaseClient";

export async function transferTreasuryFunds(params: {
  from_account_id: string;
  to_account_id: string;
  amount: number;
}) {
  const { from_account_id, to_account_id, amount } = params;

  const { data: from } = await supabase
    .from("treasury_accounts")
    .select("*")
    .eq("id", from_account_id)
    .single();

  const { data: to } = await supabase
    .from("treasury_accounts")
    .select("*")
    .eq("id", to_account_id)
    .single();

  if (!from || !to) {
    throw new Error("Treasury account missing");
  }

  if (from.balance < amount) {
    throw new Error("Insufficient treasury balance");
  }

  await supabase
    .from("treasury_accounts")
    .update({
      balance: from.balance - amount,
    })
    .eq("id", from_account_id);

  await supabase
    .from("treasury_accounts")
    .update({
      balance: to.balance + amount,
    })
    .eq("id", to_account_id);

  return {
    success: true,
  };
}