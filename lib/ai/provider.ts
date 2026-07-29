/**
 * AI provider selection for LookFinesse.
 *
 * ## Groq vs OpenAI
 * - **OpenAI is the only LLM provider used in this app.**
 * - There is **no Groq** integration (`GROQ_API_KEY` is unused / not wired).
 * - When `OPENAI_API_KEY` is set: chat, Today tips, sentiment, embeddings, and
 *   intelligence insights call OpenAI (`gpt-4o` for deep reasoning, `gpt-4o-mini`
 *   for fast / structured tasks).
 * - When the key is missing or invalid: rich demo / local fallbacks (see
 *   `lib/ai/prompts.ts`, `weatherTips.ts`, etc.).
 *
 * Optional future: Groq could be wired as a fast fallback behind
 * `GROQ_API_KEY`, but it is intentionally not present to avoid provider confusion.
 */

export type AiModelTier = "fast" | "deep";

const PLACEHOLDER_KEYS = new Set(["", "sk-your-key-here", "your-key", "changeme"]);

export function isOpenAiConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY ?? "";
  return key.length > 20 && !PLACEHOLDER_KEYS.has(key);
}

/** Prefer gpt-4o for deep intelligence; gpt-4o-mini for latency-sensitive paths. */
export function resolveOpenAiModel(tier: AiModelTier = "fast"): string {
  if (tier === "deep") return process.env.OPENAI_MODEL_DEEP?.trim() || "gpt-4o";
  return process.env.OPENAI_MODEL_FAST?.trim() || "gpt-4o-mini";
}

export function getAiProviderLabel(): "openai" | "demo" {
  return isOpenAiConfigured() ? "openai" : "demo";
}

export type RoleContext = "shopper" | "vendor" | "admin";

export function buildRoleSystemAddon(role?: RoleContext | string | null): string {
  switch (role) {
    case "admin":
      return `\nROLE CONTEXT: Platform admin. You may discuss marketplace risk, sentiment, treasury, vendor health, and ops. Prefer deep, decisive answers with links to /intelligence, /admin, /finance.`;
    case "vendor":
      return `\nROLE CONTEXT: Vendor / creator. Focus on merchandising, ads, live commerce, payouts, and growth. Link to /vendor/intelligence, /dashboard/creator-studio, /dashboard/ads when useful.`;
    case "shopper":
      return `\nROLE CONTEXT: Shopper. Focus on style, beauty, fitness, bookings, and shopping. Link to /shop, /services, /ai/stylist, /ai/virtual-dresser, /for-you.`;
    default:
      return "";
  }
}
