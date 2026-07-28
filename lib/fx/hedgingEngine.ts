import { supabase } from "@/lib/supabaseClient";

export async function createFxHedge(params: {
  currency_pair: string;
  protected_amount: number;
  hedge_rate: number;
}) {
  const {
    currency_pair,
    protected_amount,
    hedge_rate,
  } = params;

  await supabase.from("fx_hedges").insert([
    {
      currency_pair,
      protected_amount,
      hedge_rate,
    },
  ]);

  return {
    success: true,
  };
}