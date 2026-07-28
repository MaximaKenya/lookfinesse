import { supabase } from "@/lib/supabaseClient";

import { evaluateFreeze } from "@/lib/risk/freezeEngine";
import { determineTrustTier } from "@/lib/risk/trustTierEngine";

export interface RiskInput {
  vendor_id: string;
  payout_amount: number;
  recent_payout_count: number;
  failed_attempts: number;
}

/**
 * MAIN SCORING FUNCTION
 */
export async function calculateRiskScore(input: RiskInput) {
  let score = 0;

  // 1. Large payout risk
  if (input.payout_amount > 100000) score += 30;
  else if (input.payout_amount > 50000) score += 15;

  // 2. Velocity risk
  if (input.recent_payout_count > 10) score += 25;
  else if (input.recent_payout_count > 5) score += 10;

  // 3. Retry abuse
  if (input.failed_attempts > 3) score += 20;

  return Math.min(score, 100);
}

/**
 * SAVE RISK SCORE
 */
export async function saveRiskScore(
  vendor_id: string,
  score: number
) {
  const is_frozen = score >= 80;

  const trust_tier = determineTrustTier(
    score,
    is_frozen
  );

  await supabase.from("vendor_risk_scores").upsert({
    vendor_id,
    risk_score: score,
    is_frozen,
    trust_tier,
    last_updated: new Date().toISOString(),
  });

  await evaluateFreeze(vendor_id, score);
}
