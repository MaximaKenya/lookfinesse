import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { SYSTEM_PROMPTS, getDemoResponse } from "@/lib/ai/prompts";
import { buildAIContext } from "@/lib/ai/buildAIContext";
import { generateTodayTips, type WeatherInput } from "@/lib/ai/weatherTips";
import {
  buildRoleSystemAddon,
  getAiProviderLabel,
  isOpenAiConfigured,
  resolveOpenAiModel,
  type RoleContext,
} from "@/lib/ai/provider";

const WEATHER_RE = /\b(weather|rain|sunny|hot|cold|humid|wear|outfit for|today)\b/i;
const NAVIGATE_RE = /\b(take me|navigate|show vendors|go to|browse|find)\b/i;

async function getWeather(
  origin: string,
  lat?: number,
  lng?: number,
  city?: string
): Promise<WeatherInput | null> {
  try {
    const qs = new URLSearchParams();
    if (lat != null) qs.set("lat", String(lat));
    if (lng != null) qs.set("lng", String(lng));
    if (city) qs.set("city", city);
    const res = await fetch(`${origin}/api/weather?${qs}`);
    if (!res.ok) return null;
    return (await res.json()) as WeatherInput;
  } catch {
    return null;
  }
}

function buildWeatherReply(weather: WeatherInput | null, message: string): string {
  if (!weather) return "";
  const tips = generateTodayTips(weather);
  const intent = message.toLowerCase();

  if (NAVIGATE_RE.test(intent)) {
    return [
      `Here's where to find what I just suggested for ${weather.city} (${weather.temperatureC}°C, ${weather.description.toLowerCase()}):`,
      "",
      `- **Outfits** → [/shop?category=fashion](/shop?category=fashion)`,
      `- **Beauty / SPF / serums** → [/shop?category=beauty](/shop?category=beauty)`,
      `- **Fitness gear** → [/shop?category=fitness](/shop?category=fitness)`,
      `- **Book a session** → [/services](/services)`,
      `- **Top stylists in Nairobi** → [/services?category=style](/services?category=style)`,
    ].join("\n");
  }

  const outfit = tips.find((t) => t.category === "outfit")!;
  const skincare = tips.find((t) => t.category === "skincare")!;
  const fitness = tips.find((t) => t.category === "fitness")!;

  return [
    `**Real-time weather in ${weather.city}:** ${weather.temperatureC}°C, ${weather.description.toLowerCase()}, humidity ${weather.humidity}%, wind ${weather.windKph} km/h.`,
    "",
    `**👗 What to wear** — ${outfit.body} [Shop outfits](${outfit.productHref}) · [Book a stylist](${outfit.serviceHref})`,
    "",
    `**🌿 Skin** — ${skincare.body} [Shop beauty](${skincare.productHref}) · [Book a facial](${skincare.serviceHref})`,
    "",
    `**💪 Move** — ${fitness.body} [Shop fitness gear](${fitness.productHref}) · [Book a trainer](${fitness.serviceHref})`,
    "",
    `_Say "take me to vendors who sell these" and I'll deep-link you straight to the shop and booking pages._`,
  ].join("\n");
}

function enrichDemoReply(
  assistantType: string,
  message: string,
  weather: WeatherInput | null,
  role?: RoleContext
): string {
  if (weather && WEATHER_RE.test(message)) {
    return buildWeatherReply(weather, message);
  }
  const base = getDemoResponse(assistantType, message);
  const roleNote =
    role === "admin"
      ? "\n\n_Admin demo mode — open [/intelligence](/intelligence) for live signals._"
      : role === "vendor"
        ? "\n\n_Vendor demo mode — open [/vendor/intelligence](/vendor/intelligence) for growth signals._"
        : "\n\n_Tip: set OPENAI_API_KEY for deeper, personalized answers._";
  return `${base}${roleNote}`;
}

export async function POST(req: Request) {
  let body: {
    userId?: string;
    assistantType?: string;
    message?: string;
    lat?: number;
    lng?: number;
    city?: string;
    role?: RoleContext;
  } = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    assistantType = "concierge",
    message = "",
    lat,
    lng,
    city,
    role: bodyRole,
  } = body;

  if (!message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const origin = new URL(req.url).origin;
  const wantsWeather = WEATHER_RE.test(message);
  let weather: WeatherInput | null = null;
  if (wantsWeather) {
    weather = await getWeather(origin, lat, lng, city);
  }

  // Resolve authenticated user + role for richer context
  let userId = body.userId ?? "";
  let role: RoleContext | undefined = bodyRole;
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      if (!role) {
        const { data: roleRows } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        const roles = (roleRows ?? []).map((r) => r.role);
        if (roles.includes("admin")) role = "admin";
        else if (roles.includes("vendor")) role = "vendor";
        else role = "shopper";
      }
    }
  } catch {
    /* anon / demo */
  }

  const provider = getAiProviderLabel();

  if (!isOpenAiConfigured()) {
    const reply = enrichDemoReply(assistantType, message, weather, role);
    return NextResponse.json({ reply, provider });
  }

  try {
    const context = userId ? await buildAIContext(userId) : { profile: null, interests: [], memory: [] };
    const systemPrompt =
      SYSTEM_PROMPTS[assistantType as keyof typeof SYSTEM_PROMPTS] ??
      SYSTEM_PROMPTS.concierge;

    const weatherContext = weather
      ? `\n\nREAL-TIME WEATHER (${weather.city}): ${weather.temperatureC}°C, ${weather.description}, humidity ${weather.humidity}%, wind ${weather.windKph}kph. USE THIS INSTEAD OF A GENERIC ANSWER. End your message offering to navigate to /shop or /services.`
      : "";

    const prefs =
      (context.profile as { preferences?: unknown } | null)?.preferences ?? null;
    const deep =
      role === "admin" ||
      assistantType === "ops" ||
      assistantType === "vendor" ||
      message.length > 180;

    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: resolveOpenAiModel(deep ? "deep" : "fast"),
      messages: [
        {
          role: "system",
          content: `${systemPrompt}${buildRoleSystemAddon(role)}${weatherContext}

USER PREFERENCES:
${JSON.stringify(prefs ?? {})}

USER PROFILE:
${JSON.stringify(context.profile ?? {})}

INTERESTS:
${JSON.stringify(context.interests ?? [])}

MEMORY:
${JSON.stringify(context.memory ?? [])}

Be specific, actionable, and Nairobi-aware. Prefer LookFinesse deep links.`,
        },
        { role: "user", content: message },
      ],
      max_tokens: deep ? 1100 : 700,
      temperature: 0.7,
    });

    const reply =
      completion.choices[0]?.message?.content ??
      enrichDemoReply(assistantType, message, weather, role);
    return NextResponse.json({ reply, provider, model: resolveOpenAiModel(deep ? "deep" : "fast") });
  } catch (err) {
    console.error("AI chat error:", err);
    const reply = enrichDemoReply(assistantType, message, weather, role);
    return NextResponse.json({ reply, provider: "demo" });
  }
}
