import { supabase } from "@/lib/supabaseClient";

export async function rebalanceLiquidityPools() {
  const { data: pools } = await supabase
    .from("liquidity_pools")
    .select("*");

  if (!pools || pools.length < 2) return;

  for (const pool of pools) {
    if (
      pool.available_liquidity <
      pool.minimum_required
    ) {
      const donor = pools.find(
        (p) =>
          p.id !== pool.id &&
          p.available_liquidity >
            p.minimum_required * 2
      );

      if (!donor) continue;

      const transferAmount =
        pool.minimum_required -
        pool.available_liquidity;

      await supabase
        .from("liquidity_pools")
        .update({
          available_liquidity:
            donor.available_liquidity -
            transferAmount,
        })
        .eq("id", donor.id);

      await supabase
        .from("liquidity_pools")
        .update({
          available_liquidity:
            pool.available_liquidity +
            transferAmount,
        })
        .eq("id", pool.id);
    }
  }
}