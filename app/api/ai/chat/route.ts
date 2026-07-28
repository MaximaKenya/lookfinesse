import { NextResponse } from "next/server";
import { SYSTEM_PROMPTS, getDemoResponse } from "@/lib/ai/prompts";
import { buildAIContext } from "@/lib/ai/buildAIContext";
import { generateTodayTips, type WeatherInput } from "@/lib/ai/weatherTips";

const WEATHER_RE = /\b(weather|rain|sunny|hot|cold|humid|wear|outfit for|today)\b/i;
const NAVIGATE_RE = /\b(take me|navigate|show vendors|go to|browse|find)\b/i;

async function getWeather(origin: string, lat?: number, lng?: number, city?: string): Promise<WeatherInput | null> {
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

  // If the user asked to "take me to vendors" / navigation intent, surface a
  // direct deep-link list rather than long-form text.
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

export async function POST(req: Request) {
  let body: { userId?: string; assistantType?: string; message?: string; lat?: number; lng?: number; city?: string } = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, assistantType = "concierge", message = "", lat, lng, city } = body;

  if (!message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const origin = new URL(req.url).origin;
  const apiKey = process.env.OPENAI_API_KEY;
  const wantsWeather = WEATHER_RE.test(message);
  let weather: WeatherInput | null = null;
  if (wantsWeather) {
    weather = await getWeather(origin, lat, lng, city);
  }

  // Use enhanced demo intelligence when no OpenAI key configured
  if (!apiKey || apiKey.length < 20 || apiKey === "sk-your-key-here") {
    if (weather) {
      return NextResponse.json({ reply: buildWeatherReply(weather, message) });
    }
    const reply = getDemoResponse(assistantType, message);
    return NextResponse.json({ reply });
  }

  try {
    const context = await buildAIContext(userId ?? "");
    const systemPrompt =
      SYSTEM_PROMPTS[assistantType as keyof typeof SYSTEM_PROMPTS] ??
      SYSTEM_PROMPTS.concierge;

    const weatherContext = weather
      ? `\n\nREAL-TIME WEATHER (${weather.city}): ${weather.temperatureC}°C, ${weather.description}, humidity ${weather.humidity}%, wind ${weather.windKph}kph. USE THIS INSTEAD OF A GENERIC ANSWER. End your message offering to navigate to /shop or /services.`
      : "";

    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `${systemPrompt}${weatherContext}\n\nUSER PROFILE:\n${JSON.stringify(context.profile)}\n\nINTERESTS:\n${JSON.stringify(context.interests)}`,
        },
        { role: "user", content: message },
      ],
      max_tokens: 700,
    });

    const reply =
      completion.choices[0]?.message?.content ??
      (weather ? buildWeatherReply(weather, message) : getDemoResponse(assistantType, message));
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("AI chat error:", err);
    const reply = weather
      ? buildWeatherReply(weather, message)
      : getDemoResponse(assistantType, message);
    return NextResponse.json({ reply });
  }
}
