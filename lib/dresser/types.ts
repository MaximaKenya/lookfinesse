export type DresserPrefs = {
  size?: string;
  heightCm?: number;
  weightKg?: number;
  gender?: "female" | "male" | "neutral";
  skinTone?: string;
  avatarUrl?: string | null;
  avatarMode?: "svg" | "openai";
};

export const SKIN_TONES = [
  { id: "fair", color: "#F5D0C5" },
  { id: "light", color: "#E8B4A0" },
  { id: "medium", color: "#C68642" },
  { id: "tan", color: "#A66E3A" },
  { id: "deep", color: "#6B4423" },
  { id: "rich", color: "#4A2F1A" },
] as const;

export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export function skinToneColor(id?: string): string {
  return SKIN_TONES.find((s) => s.id === id)?.color ?? "#E8B4A0";
}

export function buildMannequinParams(prefs: DresserPrefs) {
  const h = prefs.heightCm ?? 170;
  const w = prefs.weightKg ?? 65;
  const bmi = w / ((h / 100) ** 2);
  const shoulder = prefs.gender === "male" ? 1.08 : prefs.gender === "female" ? 0.94 : 1;
  const widthScale = Math.min(1.25, Math.max(0.82, 0.9 + (bmi - 22) * 0.025)) * shoulder;
  return {
    skin: skinToneColor(prefs.skinTone),
    widthScale,
    heightScale: Math.min(1.12, Math.max(0.88, h / 170)),
  };
}
