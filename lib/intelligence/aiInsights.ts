import { groqChat } from "@/lib/ai/groq";
import { isGroqReady } from "@/lib/ai/provider";

function localFallbackInsight(data: any) {
  const suspicious = data?.risk?.suspiciousCount || 0;
  const avgRisk = data?.risk?.averageRisk || 0;
  const hotspots = data?.heatmap || [];

  let summary = "";

  if (suspicious > 5) {
    summary += "High volume of suspicious activity. ";
  }

  if (avgRisk > 0.7) {
    summary += "System-wide risk is elevated. ";
  }

  const topZone = hotspots[0];

  if (topZone) {
    summary += `${topZone.zone} currently shows the highest anomaly intensity. `;
  }

  if (!summary) {
    summary = "The marketplace is operating within normal parameters.";
  }

  return summary;
}

export async function generateAIInsight(data: any) {
  if (!isGroqReady()) {
    return localFallbackInsight(data);
  }

  try {
    const text = await groqChat({
      maxTokens: 500,
      messages: [
        {
          role: "system",
          content:
            "You are the LookFinesse fraud desk. Be decisive, cite signals from the payload, and recommend the next admin action.",
        },
        { role: "user", content: JSON.stringify(data) },
      ],
    });
    return text || localFallbackInsight(data);
  } catch (err: any) {
    console.error("GROQ FAILED → USING LOCAL AI:", err.message);
    return localFallbackInsight(data);
  }
}
