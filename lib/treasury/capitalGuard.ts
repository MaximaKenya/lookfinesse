export function validateCapitalSafety(params: {
  payout_amount: number;
  available_liquidity: number;
  reserve_balance: number;
}) {
  const {
    payout_amount,
    available_liquidity,
    reserve_balance,
  } = params;

  // Never consume reserve funds dangerously
  const projected =
    available_liquidity - payout_amount;

  if (projected < reserve_balance * 0.2) {
    return {
      safe: false,
      reason: "Reserve protection triggered",
    };
  }

  return {
    safe: true,
  };
}