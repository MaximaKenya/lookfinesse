import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { computeRiskEngine } from "@/lib/intelligence/riskEngine";
import { groqChat } from "@/lib/ai/groq";
import { isGroqReady, resolveAiModel } from "@/lib/ai/provider";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/security/rateLimit";

export async function POST(req: Request) {
  if (!rateLimit(`ai-copilot:${clientIp(req)}`, 15, 60_000)) return tooManyRequests();
  const { question } = await req.json().catch(() => ({ question: "" }));

  const supabase = await createSupabaseServer();
  const { data: txns } = await supabase.from("ledger_entries").select("*").limit(500);

  const riskReport = computeRiskEngine(txns ?? []);

  if (!isGroqReady()) {
    return NextResponse.json({
      insight:
        "Ops summary is running on local rules. Add GROQ_API_KEY for a written risk briefing. Review the clusters in this payload in the meantime.",
      raw: riskReport,
      provider: "demo",
    });
  }

  const insight = await groqChat({
    maxTokens: 700,
    messages: [
      {
        role: "system",
        content:
          "You are the LookFinesse financial operations copilot. Explain fraud, risk, anomalies, and treasury insights clearly. Prefer short actionable bullets. Do not invent transactions that are not in the payload.",
      },
      {
        role: "user",
        content: JSON.stringify({ question, riskReport }),
      },
    ],
  });

  return NextResponse.json({
    insight:
      insight ||
      "Groq did not return a briefing. Use the raw risk report and try again.",
    raw: riskReport,
    provider: insight ? "groq" : "demo",
    model: resolveAiModel("deep"),
  });
}
