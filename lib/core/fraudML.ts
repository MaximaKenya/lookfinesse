// /lib/core/fraudML.ts

export type FraudFeatures = {
  amount: number;
  avgAmount: number;
  frequency: number;
  avgFrequency: number;
  locationVariance: number; // 0–1
  failedAttempts: number;
  accountAgeDays: number;
};

export type FraudResult = {
  score: number;
  risk: "low" | "medium" | "high";
  flags: string[];
};

export function computeFraudScore(features: FraudFeatures): FraudResult {
  let score = 0;
  const flags: string[] = [];

  // 📈 Amount anomaly
  if (features.amount > features.avgAmount * 2) {
    score += 0.25;
    flags.push("High amount vs baseline");
  }

  // ⚡ Frequency spike
  if (features.frequency > features.avgFrequency * 2) {
    score += 0.2;
    flags.push("Transaction frequency spike");
  }

  // 🌍 Location anomaly
  if (features.locationVariance > 0.7) {
    score += 0.2;
    flags.push("Location inconsistency");
  }

  // ❌ Failed attempts
  if (features.failedAttempts > 3) {
    score += 0.15;
    flags.push("Multiple failed attempts");
  }

  // 🆕 New account risk
  if (features.accountAgeDays < 7) {
    score += 0.15;
    flags.push("New account risk");
  }

  // 🧠 Normalize
  score = Math.min(score, 1);

  let risk: FraudResult["risk"] = "low";
  if (score > 0.7) risk = "high";
  else if (score > 0.4) risk = "medium";

  return { score, risk, flags };
}