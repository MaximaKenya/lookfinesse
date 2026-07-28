/** Body zones for virtual try-on layering (back → front z-index). */
export type DresserZone =
  | "back"
  | "legs"
  | "torso"
  | "feet"
  | "neck"
  | "head"
  | "face"
  | "hand";

export type ZoneLayer = {
  zone: DresserZone;
  zIndex: number;
  /** SVG viewBox coordinates for overlay placement */
  x: number;
  y: number;
  width: number;
  height: number;
};

export const ZONE_LAYERS: ZoneLayer[] = [
  { zone: "back", zIndex: 1, x: 18, y: 52, width: 84, height: 90 },
  { zone: "legs", zIndex: 2, x: 30, y: 118, width: 60, height: 58 },
  { zone: "torso", zIndex: 3, x: 24, y: 60, width: 72, height: 62 },
  { zone: "feet", zIndex: 4, x: 30, y: 168, width: 60, height: 22 },
  { zone: "neck", zIndex: 5, x: 44, y: 48, width: 32, height: 16 },
  { zone: "head", zIndex: 6, x: 40, y: 16, width: 40, height: 34 },
  { zone: "face", zIndex: 7, x: 46, y: 24, width: 28, height: 22 },
  { zone: "hand", zIndex: 8, x: 10, y: 74, width: 22, height: 28 },
];

export const ZONE_Z_INDEX: Record<DresserZone, number> = Object.fromEntries(
  ZONE_LAYERS.map((l) => [l.zone, l.zIndex])
) as Record<DresserZone, number>;

/** @deprecated use inferTryOnZone from lib/dresser/tryOn */
export function inferZoneFromProduct(
  category?: string | null,
  name?: string | null
): DresserZone {
  const c = (category ?? "").toLowerCase();
  const n = (name ?? "").toLowerCase();
  const text = `${c} ${n}`;

  if (/beard|mustache|facial|serum|oil|cream|lotion|makeup|skincare|grooming|beauty|cosmetic/.test(text)) return "face";
  if (/hat|cap|beanie|headband|headwear/.test(text)) return "head";
  if (/scarf|necklace|neck|pendant|choker/.test(text)) return "neck";
  if (/shoe|sneaker|boot|heel|footwear|sandal/.test(text)) return "feet";
  if (/backpack|rucksack|back pack/.test(text)) return "back";
  if (/handbag|purse|clutch|tote|bag(?!pack)/.test(text)) return "hand";
  if (/jean|pant|trouser|skirt|short|bottom|legging/.test(text)) return "legs";
  if (/top|shirt|blazer|jacket|hoodie|bra|dress|crop|torso|fashion|activewear/.test(text))
    return "torso";

  if (c === "footwear") return "feet";
  if (c === "accessories") return "hand";
  if (c === "fashion" || c === "men" || c === "women") return "torso";

  return "torso";
}

export function getZoneLayer(zone: DresserZone): ZoneLayer {
  return ZONE_LAYERS.find((l) => l.zone === zone) ?? ZONE_LAYERS[2];
}

export const ZONE_CLIP_IDS: Record<DresserZone, string> = {
  back: "clip-back",
  legs: "clip-legs",
  torso: "clip-torso",
  feet: "clip-feet",
  neck: "clip-neck",
  head: "clip-head",
  face: "clip-face",
  hand: "clip-hand",
};
