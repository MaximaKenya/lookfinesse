/**
 * LookFinesse AI runs on Groq (OpenAI-compatible chat completions).
 * When GROQ_API_KEY is missing, assistants fall back to local copy.
 */

import { isGroqConfigured, resolveGroqModel } from "@/lib/ai/groq";

export type AiModelTier = "fast" | "deep";

export function isGroqReady(): boolean {
  return isGroqConfigured();
}

/** Single Groq model for every assistant. Override with GROQ_MODEL. */
export function resolveAiModel(_tier: AiModelTier = "fast"): string {
  return resolveGroqModel();
}

export function getAiProviderLabel(): "groq" | "demo" {
  return isGroqConfigured() ? "groq" : "demo";
}

export type RoleContext = "shopper" | "vendor" | "admin";

export function buildRoleSystemAddon(role?: RoleContext | string | null): string {
  switch (role) {
    case "admin":
      return `\nROLE CONTEXT: Platform admin. You may discuss marketplace risk, sentiment, treasury, vendor health, and ops. Prefer decisive answers with links to /intelligence, /admin, /finance.`;
    case "vendor":
      return `\nROLE CONTEXT: Vendor / creator. Focus on merchandising, ads, live commerce, payouts, and growth. Link to /vendor/intelligence, /dashboard/creator-studio, /dashboard/ads when useful.`;
    case "shopper":
      return `\nROLE CONTEXT: Shopper. Focus on style, beauty, fitness, bookings, and shopping. Link to /shop, /services, /ai/stylist, /ai/virtual-dresser, /for-you.`;
    default:
      return "";
  }
}
