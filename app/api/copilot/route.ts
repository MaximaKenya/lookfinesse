import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { computeRiskEngine } from "@/lib/intelligence/riskEngine";
import OpenAI from "openai";
import { isOpenAiConfigured, resolveOpenAiModel } from "@/lib/ai/provider";

export async function POST(req: Request) {
  const { question } = await req.json();

  const supabase = await createSupabaseServer();
  const { data: txns } = await supabase.from("ledger_entries").select("*").limit(500);

  const riskReport = computeRiskEngine(txns ?? []);

  if (!isOpenAiConfigured()) {
    return NextResponse.json({
      insight:
        "Demo ops summary: review risk clusters in the payload. Configure OPENAI_API_KEY for gpt-4o analysis.",
      raw: riskReport,
      provider: "demo",
    });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: resolveOpenAiModel("deep"),
    messages: [
      {
        role: "system",
        content:
          "You are an AI financial operations copilot for LookFinesse. Explain fraud, risk, anomalies, and treasury insights clearly and decisively. Prefer actionable bullets.",
      },
      {
        role: "user",
        content: JSON.stringify({ question, riskReport }),
      },
    ],
  });

  return NextResponse.json({
    insight: completion.choices[0].message.content,
    raw: riskReport,
    provider: "openai",
    model: resolveOpenAiModel("deep"),
  });
}
