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
import { resolveLocationWeather } from "@/lib/weather/resolveLocationWeather";
import { queryNearby } from "@/lib/geo/queryNearby";
import { supabase as publicClient } from "@/lib/supabaseClient";

const WEATHER_RE = /\b(weather|rain|sunny|hot|cold|humid|wear|outfit for|today|forecast)\b/i;
const NAVIGATE_RE = /\b(take me|navigate|show vendors|go to|browse|find)\b/i;
const NEARBY_RE = /\b(near me|nearby|closest|around me|in my area|near-me|proximity)\b/i;

type HistoryTurn = { role: "user" | "assistant"; content: string };

async function getWeather(lat?: number, lng?: number, city?: string): Promise<WeatherInput | null> {
  const summary = await resolveLocationWeather({ lat: lat ?? null, lng: lng ?? null, city });
  if (!summary) return null;
  return {
    city: summary.city,
    temperatureC: summary.temperatureC,
    description: summary.description,
    humidity: summary.humidity,
    windKph: summary.windKph,
    weatherCode: summary.weatherCode,
    isDay: summary.isDay,
  };
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
      `- **Near you** → [/nearby](/nearby)`,
    ].join("\n");
  }

  const outfit = tips.find((t) => t.category === "outfit")!;
  const skincare = tips.find((t) => t.category === "skincare")!;
  const fitness = tips.find((t) => t.category === "fitness")!;

  return [
    `**Live weather in ${weather.city}:** ${weather.temperatureC}°C, ${weather.description.toLowerCase()}, humidity ${weather.humidity}%, wind ${weather.windKph} km/h.`,
    "",
    `**👗 What to wear** — ${outfit.body} [Shop outfits](${outfit.productHref}) · [Book a stylist](${outfit.serviceHref})`,
    "",
    `**🌿 Skin** — ${skincare.body} [Shop beauty](${skincare.productHref}) · [Book a facial](${skincare.serviceHref})`,
    "",
    `**💪 Move** — ${fitness.body} [Shop fitness gear](${fitness.productHref}) · [Book a trainer](${fitness.serviceHref})`,
    "",
    `_Ask "what's near me" for shops and bookings by distance._`,
  ].join("\n");
}

function formatNearbyReply(payload: Awaited<ReturnType<typeof queryNearby>>): string {
  const top = payload.places.slice(0, 5);
  if (!top.length) {
    return `I couldn't find vendors in a ${payload.origin.radiusKm} km radius. Open [/nearby](/nearby) to widen the range, or browse [/shop](/shop) and [/services](/services).`;
  }
  const lines = top.map(
    (p) =>
      `- ${p.emoji} **${p.name}** (${p.category}${p.distance ? ` · ${p.distance}` : ""}) → [Visit](${p.href})`
  );
  const services = payload.services.slice(0, 3);
  const serviceLines = services.map(
    (s) => `- 📅 **${s.title}** — KES ${s.price.toLocaleString()} ${s.distance ? `· ${s.distance}` : ""} → [Book](${s.href})`
  );
  return [
    `**Near you** (${payload.origin.usingFallback ? "Nairobi fallback" : `${payload.origin.radiusKm} km radius`}):`,
    "",
    ...lines,
    ...(serviceLines.length ? ["", "**Book these nearby:**", ...serviceLines] : []),
    "",
    `[Open the full Near me map →](/nearby)`,
  ].join("\n");
}

function enrichDemoReply(
  assistantType: string,
  message: string,
  weather: WeatherInput | null,
  role?: RoleContext,
  nearbyText?: string
): string {
  if (nearbyText) return nearbyText;
  if (weather && WEATHER_RE.test(message)) {
    return buildWeatherReply(weather, message);
  }
  const base = getDemoResponse(assistantType, message);
  const roleNote =
    role === "admin"
      ? "\n\n_Admin demo mode — open [/intelligence](/intelligence) for live signals._"
      : role === "vendor"
        ? "\n\n_Vendor demo mode — open [/vendor/intelligence](/vendor/intelligence) for growth signals._"
        : "\n\n_Tip: set OPENAI_API_KEY for deeper, personalized answers. Try **what's near me** or **what should I wear today**._";
  return `${base}${roleNote}`;
}

function sseChunk(delta: string) {
  return `data: ${JSON.stringify({ delta })}\n\n`;
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
    history?: HistoryTurn[];
    stream?: boolean;
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
    history = [],
    stream: wantStream,
  } = body;

  if (!message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const wantsStream =
    wantStream || (req.headers.get("accept") ?? "").includes("text/event-stream");

  const wantsWeather = WEATHER_RE.test(message);
  const wantsNearby = NEARBY_RE.test(message);
  let weather: WeatherInput | null = null;
  if (wantsWeather) {
    weather = await getWeather(lat, lng, city);
  }

  let nearbyText = "";
  let supabase: Awaited<ReturnType<typeof createSupabaseServer>> | null = null;
  let userId = body.userId ?? "";
  let role: RoleContext | undefined = bodyRole;

  try {
    supabase = await createSupabaseServer();
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

  if (wantsNearby) {
    try {
      const payload = await queryNearby(supabase ?? publicClient, {
        lat,
        lng,
        radiusKm: 15,
        kind: "all",
      });
      nearbyText = formatNearbyReply(payload);
    } catch {
      nearbyText = "I couldn't load nearby vendors just now. Open [/nearby](/nearby) to try the map.";
    }
  }

  const provider = getAiProviderLabel();

  const persist = async (reply: string) => {
    if (!userId || !supabase) return;
    try {
      await supabase.from("copilot_messages").insert([
        { user_id: userId, role: "user", content: message, metadata: { assistantType } },
        { user_id: userId, role: "assistant", content: reply, metadata: { assistantType, provider } },
      ]);
    } catch {
      /* non-blocking */
    }
  };

  if (!isOpenAiConfigured()) {
    const reply = enrichDemoReply(assistantType, message, weather, role, nearbyText || undefined);
    await persist(reply);
    if (wantsStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(sseChunk(reply)));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }
    return NextResponse.json({ reply, provider });
  }

  try {
    const context = userId
      ? await buildAIContext(userId, supabase ?? undefined)
      : { profile: null, interests: [], memory: [] };
    const systemPrompt =
      SYSTEM_PROMPTS[assistantType as keyof typeof SYSTEM_PROMPTS] ??
      SYSTEM_PROMPTS.concierge;

    const weatherContext = weather
      ? `\n\nREAL-TIME WEATHER (${weather.city}): ${weather.temperatureC}°C, ${weather.description}, humidity ${weather.humidity}%, wind ${weather.windKph}kph. USE THIS INSTEAD OF A GENERIC ANSWER.`
      : "";
    const nearbyContext = nearbyText ? `\n\nNEARBY RESULTS (already fetched — summarise and link, do not invent vendors):\n${nearbyText}` : "";

    const prefs =
      (context.profile as { preferences?: unknown } | null)?.preferences ?? null;
    const deep =
      role === "admin" ||
      assistantType === "ops" ||
      assistantType === "vendor" ||
      message.length > 180;

    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: `${systemPrompt}${buildRoleSystemAddon(role)}${weatherContext}${nearbyContext}

USER PREFERENCES:
${JSON.stringify(prefs ?? {})}

USER PROFILE:
${JSON.stringify(context.profile ?? {})}

INTERESTS:
${JSON.stringify(context.interests ?? [])}

MEMORY:
${JSON.stringify(context.memory ?? [])}

Be specific, actionable, and Nairobi-aware. Prefer LookFinesse deep links (/shop, /services, /nearby, /ai/stylist, /ai/fitness). Keep answers scannable with short bullets.`,
      },
    ];

    for (const turn of history.slice(-8)) {
      if (turn.role === "user" || turn.role === "assistant") {
        messages.push({ role: turn.role, content: turn.content });
      }
    }
    messages.push({ role: "user", content: message });

    if (wantsStream) {
      const completion = await openai.chat.completions.create({
        model: resolveOpenAiModel(deep ? "deep" : "fast"),
        messages,
        max_tokens: deep ? 1100 : 700,
        temperature: 0.7,
        stream: true,
      });

      let full = "";
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const part of completion) {
              const delta = part.choices[0]?.delta?.content ?? "";
              if (delta) {
                full += delta;
                controller.enqueue(encoder.encode(sseChunk(delta)));
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } catch {
            if (!full) {
              const fallback = enrichDemoReply(assistantType, message, weather, role, nearbyText || undefined);
              full = fallback;
              controller.enqueue(encoder.encode(sseChunk(fallback)));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } finally {
            controller.close();
            void persist(full);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const completion = await openai.chat.completions.create({
      model: resolveOpenAiModel(deep ? "deep" : "fast"),
      messages,
      max_tokens: deep ? 1100 : 700,
      temperature: 0.7,
    });

    const reply =
      completion.choices[0]?.message?.content ??
      enrichDemoReply(assistantType, message, weather, role, nearbyText || undefined);
    await persist(reply);
    return NextResponse.json({ reply, provider, model: resolveOpenAiModel(deep ? "deep" : "fast") });
  } catch (err) {
    console.error("AI chat error:", err);
    const reply = enrichDemoReply(assistantType, message, weather, role, nearbyText || undefined);
    await persist(reply);
    return NextResponse.json({ reply, provider: "demo" });
  }
}
