import OpenAI from "openai";
import { isOpenAiConfigured } from "@/lib/ai/provider";

let client: OpenAI | null = null;

/** Lazy OpenAI client — never constructs (or throws) at import / build time. */
export function getOpenAI(): OpenAI | null {
  if (!isOpenAiConfigured()) return null;
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}
