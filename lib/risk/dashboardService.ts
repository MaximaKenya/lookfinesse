export function formatRiskLevel(score: number) {
  if (score >= 80) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 20) return "MEDIUM";
  return "LOW";
}