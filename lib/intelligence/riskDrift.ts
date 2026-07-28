export function computeRiskDrift(
  scores: number[]
) {
  if (scores.length < 2) {
    return {
      drift: "STABLE",
    };
  }

  const latest =
    scores[scores.length - 1];

  const previous =
    scores[scores.length - 2];

  if (latest > previous + 20) {
    return {
      drift: "RAPID_RISK_ESCALATION",
    };
  }

  if (latest > previous) {
    return {
      drift: "RISK_INCREASING",
    };
  }

  return {
    drift: "STABLE",
  };
}