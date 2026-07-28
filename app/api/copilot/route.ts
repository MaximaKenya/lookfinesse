import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { computeRiskEngine } from "@/lib/intelligence/riskEngine";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { question } = await req.json();

  const { data: txns } = await supabase
    .from("ledger_entries")
    .select("*")
    .limit(500);

  const riskReport = computeRiskEngine(txns ?? []);

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an AI financial operations copilot. Explain fraud, risk, anomalies, and treasury insights clearly and decisively."
      },
      {
        role: "user",
        content: JSON.stringify({ question, riskReport })
      }
    ]
  });

  return NextResponse.json({
    insight: completion.choices[0].message.content,
    raw: riskReport
  });
}