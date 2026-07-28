import type { PlatformTierId } from "./platformTiers";

/** Enforced limits — source of truth for API gates (not marketing copy). */
export type PlatformEntitlements = {
  monthlyPostLimit: number | null;
  /** null = unlimited */
  maxProducts: number | null;
  analyticsDays: number;
  adCreditsMonthly: number;
  platformFeePercent: number;
  liveCommerce: boolean;
  adsManager: boolean;
  aiCopilot: boolean;
  featuredPlacement: boolean;
  multiStaff: boolean;
  commandCenter: boolean;
  advancedPayouts: boolean;
};

/** Route prefixes gated by tier — keep in sync with platformTiers.ts */
export const ENTITLEMENT_ROUTE_GATES = {
  pro: ["/dashboard/ads", "/dashboard/calendar", "/vendor/finance", "/dashboard/finance"],
  elite: [
    "/vendor",
    "/intelligence",
    "/vendor/intelligence",
    "/dashboard/create-live",
    "/dashboard/vendor/staff",
    "/dashboard/vendor/payout-settings",
  ],
  starterAlways: [
    "/dashboard/creator-studio",
    "/dashboard/create-post",
    "/dashboard/create-reel",
    "/dashboard/create-product",
    "/dashboard/subscription",
    "/vendor/products",
    "/vendor/orders",
  ],
} as const;

export const PLATFORM_ENTITLEMENTS: Record<PlatformTierId, PlatformEntitlements> = {
  starter: {
    monthlyPostLimit: 15,
    maxProducts: 10,
    analyticsDays: 30,
    adCreditsMonthly: 500,
    platformFeePercent: 3.5,
    liveCommerce: false,
    adsManager: false,
    aiCopilot: false,
    featuredPlacement: false,
    multiStaff: false,
    commandCenter: false,
    advancedPayouts: false,
  },
  pro: {
    monthlyPostLimit: null,
    maxProducts: 50,
    analyticsDays: 90,
    adCreditsMonthly: 2500,
    platformFeePercent: 2.5,
    liveCommerce: false,
    adsManager: true,
    aiCopilot: false,
    featuredPlacement: false,
    multiStaff: false,
    commandCenter: false,
    advancedPayouts: false,
  },
  elite: {
    monthlyPostLimit: null,
    maxProducts: null,
    analyticsDays: 365,
    adCreditsMonthly: 10000,
    platformFeePercent: 1.9,
    liveCommerce: true,
    adsManager: true,
    aiCopilot: true,
    featuredPlacement: true,
    multiStaff: true,
    commandCenter: true,
    advancedPayouts: true,
  },
};

export function getPlatformEntitlements(
  tier: string | null | undefined
): PlatformEntitlements {
  const key = (tier ?? "starter") as PlatformTierId;
  return PLATFORM_ENTITLEMENTS[key] ?? PLATFORM_ENTITLEMENTS.starter;
}

export function tierMeetsMinimum(
  current: string | null | undefined,
  required: PlatformTierId
): boolean {
  const order: PlatformTierId[] = ["starter", "pro", "elite"];
  const cur = order.indexOf((current as PlatformTierId) ?? "starter");
  const req = order.indexOf(required);
  return cur >= req && cur >= 0;
}
