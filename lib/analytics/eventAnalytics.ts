type EventTrendInput = {
  currentCount: number;
  historicalAverage: number;
};

export function analyzeEventTrend(
  input: EventTrendInput
) {
  const ratio =
    input.currentCount /
    Math.max(input.historicalAverage, 1);

  return {
    ratio,

    anomaly:
      ratio > 2,

    severity:
      ratio > 5
        ? "critical"
        : ratio > 2
        ? "high"
        : "normal",
  };
}