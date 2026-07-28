/** Demo vendor used when the signed-in user has no storefront yet. */
export const DEMO_VENDOR_ID = "a1000000-0000-0000-0000-000000000001";

import { CANONICAL_CATEGORIES } from "@/lib/categories/canonical";

export const SERVICE_CATEGORIES = CANONICAL_CATEGORIES;

export const FEED_CATEGORIES = [
  "discover",
  "fitness",
  "beauty",
  "style",
  "wellness",
] as const;
