// Personalized Today tips — OpenAI when OPENAI_API_KEY is set, else prefs-aware fallback.
// Set OPENAI_API_KEY in .env.local for super-intelligent, unique daily suggestions.

import type { UserPreferences } from "@/lib/auth/onboarding";
import { hasMeaningfulPrefs, prefsForPrompt } from "@/lib/ai/profileLabels";
import {
  generateTodayTips,
  type TodayTip,
  type WeatherInput,
} from "@/lib/ai/weatherTips";
import { isOpenAiConfigured, resolveOpenAiModel } from "@/lib/ai/provider";

export type TodayUserContext = {
  userId: string;
  preferences: UserPreferences;
  city?: string | null;
  profile?: { onboarded_at?: string | null; preferences?: UserPreferences | null };
};

export type TodayPayload = {
  weather: WeatherInput;
  summary: string;
  tips: TodayTip[];
  needsOnboarding?: boolean;
};

type CacheEntry = { at: number; payload: TodayPayload };

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6h unless refresh

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function weatherHash(w: WeatherInput): string {
  return `${w.city}|${w.temperatureC}|${w.weatherCode}|${w.humidity}|${w.description}`;
}

export function prefsHash(p: UserPreferences, userId: string): string {
  const interests = (p.interests ?? []).slice().sort().join(",");
  return [userId, p.gender ?? "", p.age_group ?? "", p.style ?? "", interests, p.city ?? ""].join("|");
}

export function cacheKey(
  userId: string,
  dateKey: string,
  wHash: string,
  pHash: string,
  refreshToken?: string
): string {
  return `${userId}:${dateKey}:${wHash}:${pHash}:${refreshToken ?? "default"}`;
}

function timeOfDayLabel(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

function shopCategoryForInterests(interests: string[] = []): string {
  const lower = interests.map((i) => i.toLowerCase());
  if (lower.some((i) => i.includes("beauty") || i.includes("skin"))) return "beauty";
  if (lower.some((i) => i.includes("fit") || i.includes("gym"))) return "fitness";
  if (lower.some((i) => i.includes("fashion") || i.includes("style"))) return "fashion";
  return "fashion";
}

async function generateWithOpenAI(
  weather: WeatherInput,
  ctx: TodayUserContext
): Promise<TodayPayload | null> {
  if (!isOpenAiConfigured()) return null;

  const { preferences: p } = ctx;
  const profile = prefsForPrompt(p, ctx.city);
  const interests = p.interests?.join(", ") || "general lifestyle";
  const tod = timeOfDayLabel();
  const shopCat = shopCategoryForInterests(p.interests);

  if (!hasMeaningfulPrefs(p, ctx.profile) && ctx.userId !== "anonymous") {
    return null;
  }

  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: resolveOpenAiModel("fast"),
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are LookFinesse, a premium lifestyle concierge for beauty, fashion, and fitness in Kenya.
Use ONLY the exact profile fields provided — never substitute defaults like male, 25-34, or Nairobi when the profile says otherwise.
If gender is female and age_group is 35-44, write for a woman in her 40s. If city is Machakos, reference Machakos — not Nairobi.
Return JSON: { "summary": string (max 3 sentences, warm, personalized), "tips": [ exactly 3 objects with keys:
  category ("outfit"|"skincare"|"fitness"), title, body (2 sentences max),
  productHref (path like /shop?category=fashion), productLabel,
  serviceHref (path like /services?category=beauty), serviceLabel ] }
Tailor outfit/skincare/fitness to gender, age_group, style, and interests. Reference actual weather. Do NOT invent product names.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            weather,
            timeOfDay: tod,
            profile,
            interests,
            defaultShopCategory: shopCat,
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { summary?: string; tips?: TodayTip[] };
    if (!parsed.summary || !Array.isArray(parsed.tips) || parsed.tips.length < 3) return null;

    const tips = parsed.tips.slice(0, 3).map((t, i) => ({
      category: (["outfit", "skincare", "fitness"] as const)[i] ?? t.category,
      title: t.title ?? "Today's pick",
      body: t.body ?? "",
      productHref: t.productHref ?? `/shop?category=${shopCat}`,
      productLabel: t.productLabel ?? "Shop picks",
      serviceHref: t.serviceHref ?? `/services?category=${t.category === "fitness" ? "fitness" : t.category === "skincare" ? "beauty" : "style"}`,
      serviceLabel: t.serviceLabel ?? "Book a pro",
    }));

    return { weather, summary: parsed.summary, tips };
  } catch {
    return null;
  }
}

export async function getPersonalizedToday(
  weather: WeatherInput,
  ctx: TodayUserContext,
  options?: { refresh?: boolean; refreshToken?: string }
): Promise<TodayPayload> {
  const dateKey = new Date().toISOString().slice(0, 10);
  const wHash = weatherHash(weather);
  const pHash = prefsHash(ctx.preferences, ctx.userId);
  const key = cacheKey(ctx.userId, dateKey, wHash, pHash, options?.refresh ? options.refreshToken ?? "refresh" : undefined);

  if (!options?.refresh) {
    const hit = CACHE.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.payload;
  }

  const ai = await generateWithOpenAI(weather, ctx);
  const needsOnboarding =
    ctx.userId !== "anonymous" && !hasMeaningfulPrefs(ctx.preferences, ctx.profile);

  const payload: TodayPayload = needsOnboarding
    ? {
        weather,
        summary:
          "Complete onboarding so we can tailor today's outfit, skincare, and fitness picks to you — your gender, age, city, and style.",
        tips: generateTodayTips(weather, ctx.preferences),
        needsOnboarding: true,
      }
    : ai ?? {
        weather,
        summary: buildFallbackSummary(weather, ctx.preferences, ctx.city),
        tips: generateTodayTips(weather, ctx.preferences),
      };

  CACHE.set(key, { at: Date.now(), payload });
  return payload;
}

function buildFallbackSummary(
  w: WeatherInput,
  p: UserPreferences,
  city?: string | null
): string {
  if (!p.gender && !p.age_group) {
    return `Today's weather in ${w.city}: ${w.temperatureC}°C, ${w.description.toLowerCase()}. Complete onboarding for personalized picks.`;
  }
  const who =
    p.gender && p.age_group
      ? `For your ${p.age_group.replace(/-/g, "–")} ${p.gender} profile`
      : "For you";
  const style = p.style ? ` and ${p.style} style` : "";
  const interests = p.interests?.length ? ` — tuned to ${p.interests.slice(0, 2).join(" & ")}` : "";
  const where = city ?? p.city ?? w.city;
  return `${who}${style}${interests}: ${where} is ${w.temperatureC}°C, ${w.description.toLowerCase()}. Dress smart, protect your skin, and move with intention. Browse the picks below.`;
}

export function bustTodayCacheForUser(userId: string) {
  for (const k of CACHE.keys()) {
    if (k.startsWith(`${userId}:`)) CACHE.delete(k);
  }
}
