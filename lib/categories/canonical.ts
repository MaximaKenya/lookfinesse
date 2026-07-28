/** Canonical marketplace categories — single source of truth for shop, products, services, stores. */
export const CANONICAL_CATEGORIES = [
  "fashion",
  "beauty",
  "fitness",
  "wellness",
  "skincare",
  "photography",
  "nutrition",
  "footwear",
  "accessories",
  "hair",
  "grooming",
  "kids",
  "men",
  "women",
] as const;

export type CanonicalCategory = (typeof CANONICAL_CATEGORIES)[number];

export const CANONICAL_CATEGORY_OPTIONS = [
  { value: "all", label: "All" },
  ...CANONICAL_CATEGORIES.map((c) => ({
    value: c,
    label: c.charAt(0).toUpperCase() + c.slice(1),
  })),
] as const;

export const SHOP_CATEGORY_OPTIONS = CANONICAL_CATEGORY_OPTIONS;

export const TOP_SHOP_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "fashion", label: "Fashion" },
  { value: "beauty", label: "Beauty" },
  { value: "fitness", label: "Fitness" },
  { value: "wellness", label: "Wellness" },
  { value: "skincare", label: "Skincare" },
  { value: "footwear", label: "Footwear" },
  { value: "accessories", label: "Accessories" },
] as const;

export const CATEGORY_HEADERS: Record<string, { title: string; subtitle: string; emoji: string }> = {
  fashion: {
    title: "Fashion",
    subtitle: "African luxury, ready-to-wear & statement pieces",
    emoji: "👗",
  },
  beauty: { title: "Beauty", subtitle: "Skincare, hair & glow essentials", emoji: "💄" },
  fitness: { title: "Fitness", subtitle: "Gear & apparel for every workout", emoji: "💪" },
  wellness: { title: "Wellness", subtitle: "Mind, body & calm essentials", emoji: "🧘" },
  skincare: { title: "Skincare", subtitle: "Serums, routines & glass-skin essentials", emoji: "✨" },
  photography: { title: "Photography", subtitle: "Portraits, content & studio services", emoji: "📸" },
  nutrition: { title: "Nutrition", subtitle: "Supplements, meal plans & wellness fuel", emoji: "🥗" },
  footwear: { title: "Footwear", subtitle: "Sneakers, heels & everyday steps", emoji: "👟" },
  accessories: { title: "Accessories", subtitle: "Bags, jewelry & finishing touches", emoji: "👜" },
  hair: { title: "Hair", subtitle: "Styling, care & protective looks", emoji: "💇" },
  grooming: { title: "Grooming", subtitle: "Beard, barber & self-care for him", emoji: "🪒" },
  kids: { title: "Kids", subtitle: "Playful styles for little trendsetters", emoji: "🧒" },
  men: { title: "Men", subtitle: "Tailored fits & everyday essentials", emoji: "👔" },
  women: { title: "Women", subtitle: "Curated looks for every occasion", emoji: "👠" },
};

export function isCanonicalCategory(value: string): value is CanonicalCategory {
  return (CANONICAL_CATEGORIES as readonly string[]).includes(value);
}
