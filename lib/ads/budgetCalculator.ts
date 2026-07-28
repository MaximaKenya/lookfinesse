/** Platform defaults for ad budget → duration / impressions / bid. */
const BASE_CPM_KES = 12; // cost per 1000 impressions baseline
const MIN_BID_KES = 5;
const MAX_BID_KES = 80;

export type BudgetBreakdown = {
  totalBudget: number;
  dailyBudget: number;
  durationDays: number;
  estimatedImpressions: number;
  bidPerImpression: number;
  estimatedClicks: number;
  ctrEstimate: number;
};

export function calculateAdBudget(totalBudget: number): BudgetBreakdown {
  const budget = Math.max(500, Math.round(totalBudget));
  const durationDays = Math.min(30, Math.max(3, Math.round(budget / 400)));
  const dailyBudget = Math.round(budget / durationDays);
  const bidPerImpression = Math.min(
    MAX_BID_KES,
    Math.max(MIN_BID_KES, Math.round((dailyBudget / 120) * 10) / 10)
  );
  const estimatedImpressions = Math.round((budget / bidPerImpression) * 1000) / 1000;
  const ctrEstimate = 0.018;
  const estimatedClicks = Math.round(estimatedImpressions * ctrEstimate);

  return {
    totalBudget: budget,
    dailyBudget,
    durationDays,
    estimatedImpressions: Math.max(100, Math.round(estimatedImpressions)),
    bidPerImpression,
    estimatedClicks,
    ctrEstimate,
  };
}
