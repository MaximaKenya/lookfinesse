import { tierMeetsMinimum } from "./platformEntitlements";

export type PlatformTierId = "starter" | "pro" | "elite";

export type PlatformTier = {
  id: PlatformTierId;
  name: string;
  /** KES / month — matches enforced billing in platform_subscriptions.price_kes */
  price: number;
  tagline: string;
  popular?: boolean;
  /** Marketing bullets shown on pricing UI */
  features: string[];
  /** Not yet enforced — see platformEntitlements.ts for gates */
  comingSoon?: string[];
};

export const PLATFORM_TIERS: PlatformTier[] = [
  {
    id: "starter",
    name: "Starter",
    price: 999,
    tagline: "Launch your brand on LookFinesse",
    features: [
      "Creator Studio — posts, reels & products",
      "Vendor dashboard & shop KPIs",
      "Public store & checkout",
      "M-Pesa & card payouts",
      "Email support (48h target)",
    ],
    comingSoon: [],
  },
  {
    id: "pro",
    name: "Pro",
    price: 2999,
    tagline: "Grow with ads, live & analytics",
    popular: true,
    features: [
      "Everything in Starter",
      "Ads Manager — promote listings",
      "Calendar & booking ops",
      "Vendor finance view & live ledger",
      "Staff roles (view-only)",
    ],
    comingSoon: ["In-app priority chat support"],
  },
  {
    id: "elite",
    name: "Elite",
    price: 4999,
    tagline: "Scale with premium visibility",
    features: [
      "Everything in Pro",
      "Full command center",
      "AI Intelligence & growth signals",
      "Go Live — shoppable sessions",
      "Multi-staff & advanced payout settings",
      "Explore placement eligibility",
    ],
    comingSoon: ["Dedicated success manager"],
  },
];

export function getPlatformTier(id: string): PlatformTier | undefined {
  return PLATFORM_TIERS.find((t) => t.id === id);
}

/** Social / shopper routes — never subscription-gated in AppNav. */
export const CONSUMER_PATH_PREFIXES = [
  "/feed",
  "/reels",
  "/explore",
  "/for-you",
  "/shop",
  "/services",
  "/live",
  "/trending",
  "/challenges",
  "/nearby",
  "/search",
  "/profile",
  "/bookings",
  "/saved",
  "/notifications",
  "/ai/",
  "/help/",
  "/cart",
  "/checkout",
] as const;

export function isConsumerAppPath(pathname: string): boolean {
  return CONSUMER_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p)
  );
}

/** Active Starter tier — basic dashboard & limited create flows. */
export const STARTER_VENDOR_PATHS = [
  "/dashboard/creator-studio",
  "/dashboard/create-post",
  "/dashboard/create-reel",
  "/dashboard/create-product",
  "/dashboard/create-service",
  "/dashboard/create-store",
  "/dashboard/subscription",
  "/dashboard/vendor/wallet",
  "/dashboard/vendor/kyc",
  "/vendor/products",
  "/vendor/orders",
  "/profile",
  "/profile/edit",
] as const;

/** Pro tier — ads, calendar, vendor finance. */
export const PRO_VENDOR_PATHS = [
  "/dashboard/ads",
  "/dashboard/calendar",
  "/vendor/finance",
  "/dashboard/finance",
] as const;

/** Elite tier — command center, intelligence, live, staff, payout settings. */
export const ELITE_VENDOR_PATHS = [
  "/dashboard/create-live",
  "/vendor/intelligence",
  "/intelligence",
  "/dashboard/vendor/staff",
  "/dashboard/vendor/payout-settings",
] as const;

/** Surfaces that show PlatformSubscriptionGate overlay when access denied. */
export const GATED_VENDOR_SURFACES = [
  "/dashboard",
  "/vendor",
  "/vendor/intelligence",
  "/dashboard/ads",
  "/dashboard/create-live",
  "/dashboard/vendor/staff",
  "/dashboard/vendor/payout-settings",
  "/intelligence",
] as const;

function pathInList(pathname: string, paths: readonly string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function matchesCommandCenter(pathname: string): boolean {
  return pathname === "/vendor";
}

export function pathRequiresPlatformSub(pathname: string): boolean {
  return GATED_VENDOR_SURFACES.some((p) => {
    if (p === "/vendor") return matchesCommandCenter(pathname);
    return pathname === p || pathname.startsWith(p + "/");
  });
}

export function pathRequiresProTier(pathname: string): boolean {
  return pathInList(pathname, PRO_VENDOR_PATHS);
}

export function pathRequiresEliteTier(pathname: string): boolean {
  return (
    pathInList(pathname, ELITE_VENDOR_PATHS) || matchesCommandCenter(pathname)
  );
}

function matchesStarterPath(pathname: string): boolean {
  return pathInList(pathname, STARTER_VENDOR_PATHS);
}

export type VendorAccessOptions = {
  isAdmin?: boolean;
  /** false when vendor has no platform_subscriptions row */
  hasSubscriptionRow?: boolean;
};

export function vendorCanAccessPath(
  pathname: string,
  active: boolean,
  tier: string | null,
  options: VendorAccessOptions = {}
): boolean {
  if (options.isAdmin) return true;
  if (isConsumerAppPath(pathname)) return true;

  if (
    pathname === "/dashboard/subscription" ||
    pathname.startsWith("/dashboard/subscription/") ||
    pathname.startsWith("/dashboard/create-store")
  ) {
    return true;
  }

  const hasRow = options.hasSubscriptionRow !== false;
  const effectiveTier = tier ?? "starter";
  const paidAccess = active && !!tier;

  if (matchesCommandCenter(pathname) || pathInList(pathname, ELITE_VENDOR_PATHS)) {
    if (!hasRow) return false;
    return paidAccess && tierMeetsMinimum(effectiveTier, "elite");
  }

  if (pathInList(pathname, PRO_VENDOR_PATHS)) {
    if (!hasRow) return false;
    return paidAccess && tierMeetsMinimum(effectiveTier, "pro");
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    if (matchesStarterPath(pathname)) return true;
  }

  if (pathname === "/dashboard") {
    return true;
  }

  if (matchesStarterPath(pathname)) {
    return true;
  }

  if (!hasRow) {
    return false;
  }

  if (!paidAccess) {
    return false;
  }

  if (tierMeetsMinimum(effectiveTier, "pro")) {
    return true;
  }

  return matchesStarterPath(pathname);
}
