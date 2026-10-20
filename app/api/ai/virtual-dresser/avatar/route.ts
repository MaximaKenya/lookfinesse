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
    void buildAvatarPrompt(prefs);
    return NextResponse.json({
      avatarUrl: null,
      mode: "svg",
      message: "Using the illustrated avatar. Groq handles styling advice; portraits stay on-device.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Avatar generation failed" },
      { status: 500 }
    );
  }
}
