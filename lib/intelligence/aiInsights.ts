import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function localFallbackInsight(data: any) {
  const suspicious =
    data?.risk?.suspiciousCount || 0;

  const avgRisk =
    data?.risk?.averageRisk || 0;

  const hotspots =
    data?.heatmap || [];

  let summary = "";

  if (suspicious > 5) {
    summary +=
      "High volume suspicious activity detected. ";
  }

  if (avgRisk > 0.7) {
    summary +=
      "System-wide risk levels elevated. ";
  }

  const topZone = hotspots[0];

  if (topZone) {
    summary += `${topZone.zone} currently shows highest anomaly intensity. `;
  }

  if (!summary) {
    summary =
      "System operating within normal parameters.";
  }

  return summary;
}

export async function generateAIInsight(
  data: any
) {
  try {
    const completion =
      await openai.chat.completions.create(
        {
          model: "gpt-4.1-mini",

          messages: [
            {
              role: "system",

              content:
                "You are an elite AI fraud intelligence system.",
            },

            {
              role: "user",

              content:
                JSON.stringify(data),
            },
          ],
        }
      );

    return (
      completion.choices[0]
        ?.message?.content ||
      localFallbackInsight(data)
    );
  } catch (err: any) {
    console.error(
      "OPENAI FAILED → USING LOCAL AI:",
      err.message
    );

    return localFallbackInsight(data);
  }
}