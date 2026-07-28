import { NextResponse } from "next/server";
import type { DresserPrefs } from "@/lib/dresser/types";

function buildAvatarPrompt(prefs: DresserPrefs): string {
  const gender = prefs.gender ?? "neutral";
  const skin = prefs.skinTone ?? "medium";
  const height = prefs.heightCm ?? 170;
  const size = prefs.size ?? "M";

  return [
    "Stylized illustrated human fashion avatar in the style of WhatsApp Meta AI portraits:",
    "soft digital illustration, warm natural skin tones, gentle facial features,",
    "subtle shading, polished editorial look — not cartoonish, not stick figure, not ugly caricature.",
    `${gender} presentation, ${skin} skin tone, approximately ${height}cm tall, clothing size ${size}.`,
    "Front-facing three-quarter portrait from head to mid-thigh on a soft gradient studio background.",
    "Neutral relaxed pose, realistic human proportions, visible face with eyes nose and lips.",
    "No text, no watermark, no logos.",
  ].join(" ");
}

export async function POST(req: Request) {
  try {
    const prefs = (await req.json()) as DresserPrefs;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (openaiKey) {
      try {
        const res = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: buildAvatarPrompt(prefs),
            n: 1,
            size: "1024x1024",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const url = data?.data?.[0]?.url;
          if (url) {
            return NextResponse.json({ avatarUrl: url, mode: "openai" });
          }
        }
      } catch {
        /* fall through to SVG demo mode */
      }
    }

    return NextResponse.json({
      avatarUrl: null,
      mode: "svg",
      message: "Using built-in illustrated avatar. Add OPENAI_API_KEY for AI-generated portraits.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Avatar generation failed" },
      { status: 500 }
    );
  }
}
