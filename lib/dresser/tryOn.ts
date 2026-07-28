import type { DresserPrefs } from "@/lib/dresser/types";
import type { DresserZone } from "@/lib/dresser/zones";

export type TryOnKind = "apparel" | "cosmetic" | "accessory";

export type TryOnCompat = {
  ok: boolean;
  kind: TryOnKind;
  zone: DresserZone;
  message?: string;
};

function textOf(category?: string | null, name?: string | null) {
  return `${category ?? ""} ${name ?? ""}`.toLowerCase();
}

export function classifyTryOn(category?: string | null, name?: string | null): TryOnKind {
  const text = textOf(category, name);
  if (/beard|oil|serum|cream|lotion|gloss|lip|makeup|skincare|fragrance|perfume|cosmetic|beauty|grooming|balm/.test(text)) {
    return "cosmetic";
  }
  if (/bag|backpack|purse|tote|handbag|hat|cap|scarf|shoe|sneaker|boot|heel|jewelry|watch|accessory/.test(text)) {
    return "accessory";
  }
  return "apparel";
}

export function inferTryOnZone(category?: string | null, name?: string | null): DresserZone {
  const text = textOf(category, name);
  if (/beard|mustache|facial hair/.test(text)) return "face";
  if (/hat|cap|beanie|headband/.test(text)) return "head";
  if (/scarf|necklace|neck|choker|pendant/.test(text)) return "neck";
  if (/shoe|sneaker|boot|heel|footwear|sandal/.test(text)) return "feet";
  if (/backpack|rucksack/.test(text)) return "back";
  if (/handbag|purse|clutch|tote|bag(?!pack)/.test(text)) return "hand";
  if (/jean|pant|trouser|skirt|short|bottom|legging/.test(text)) return "legs";
  if (/serum|cream|oil|lotion|makeup|skincare|beauty|grooming|fragrance|cosmetic/.test(text)) return "face";
  if (/top|shirt|blazer|jacket|hoodie|bra|dress|crop|fashion|activewear|men|women/.test(text)) return "torso";
  if ((category ?? "").toLowerCase() === "footwear") return "feet";
  if ((category ?? "").toLowerCase() === "accessories") return "hand";
  return "torso";
}

export function checkTryOnCompat(
  prefs: DresserPrefs,
  category?: string | null,
  name?: string | null
): TryOnCompat {
  const kind = classifyTryOn(category, name);
  const zone = inferTryOnZone(category, name);
  const text = textOf(category, name);
  const isMaleProduct = /beard|barber|mustache|men'?s grooming|male grooming/.test(text);
  const isFemaleProduct = /bra|heels|lipstick|mascara|women'?s/.test(text);

  if (isMaleProduct && prefs.gender === "female") {
    return {
      ok: false,
      kind,
      zone,
      message: "This grooming item is styled for a male avatar. Switch gender presentation or pick another product.",
    };
  }

  if (isFemaleProduct && prefs.gender === "male") {
    return {
      ok: false,
      kind,
      zone,
      message: "This item is styled for a female avatar. Switch gender presentation or pick another product.",
    };
  }

  return { ok: true, kind, zone };
}
