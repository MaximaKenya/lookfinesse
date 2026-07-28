import type { FanTierId } from "./fanTiers";

/** Enforced fan perks — APIs/pages must match these (marketing may list more in comingSoon). */
export type FanEntitlements = {
  exclusivePosts: boolean;
  commentBadge: boolean;
  shopDiscountPercent: number;
  dmAccess: boolean;
  livePriority: boolean;
};

export const FAN_ENTITLEMENTS: Record<FanTierId, FanEntitlements> = {
  supporter: {
    exclusivePosts: true,
    commentBadge: true,
    shopDiscountPercent: 0,
    dmAccess: false,
    livePriority: false,
  },
  insider: {
    exclusivePosts: true,
    commentBadge: true,
    shopDiscountPercent: 10,
    dmAccess: true,
    livePriority: true,
  },
  vip: {
    exclusivePosts: true,
    commentBadge: true,
    shopDiscountPercent: 20,
    dmAccess: true,
    livePriority: true,
  },
};

const TIER_RANK: Record<FanTierId, number> = {
  supporter: 1,
  insider: 2,
  vip: 3,
};

export function fanTierRank(tier: string | null | undefined): number {
  if (!tier) return 0;
  const key = tier.toLowerCase().replace(/\s+/g, "") as FanTierId;
  return TIER_RANK[key] ?? 0;
}

export function fanMeetsRequired(
  userTier: string | null | undefined,
  required: string | null | undefined
): boolean {
  if (!required) return true;
  return fanTierRank(userTier) >= fanTierRank(required);
}

export function getFanEntitlements(tier: string | null | undefined): FanEntitlements {
  const key = (tier?.toLowerCase().replace(/\s+/g, "") ?? "supporter") as FanTierId;
  return FAN_ENTITLEMENTS[key] ?? FAN_ENTITLEMENTS.supporter;
}
