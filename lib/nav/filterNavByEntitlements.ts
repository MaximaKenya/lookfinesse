import type { NavGroup, NavItem } from "@/lib/nav/dashboards";
import {
  isConsumerAppPath,
  vendorCanAccessPath,
} from "@/lib/subscriptions/platformTiers";

type NavLike = { href: string };

export type NavEntitlementContext = {
  role: "admin" | "vendor" | "shopper";
  subscriptionActive: boolean;
  subscriptionTier: string | null;
  hasSubscriptionRow?: boolean;
  isAdmin?: boolean;
  isVendor?: boolean;
};

export type NavItemAccess = {
  allowed: boolean;
  locked: boolean;
  upgradeHref: string;
};

const UPGRADE_HREF = "/dashboard/subscription";

function canAccessHref(ctx: NavEntitlementContext, href: string): boolean {
  // Admins: every vendor + admin nav item unlocked
  if (ctx.role === "admin" || ctx.isAdmin) return true;

  if (ctx.role === "vendor" || ctx.isVendor) {
    if (href === UPGRADE_HREF || href.startsWith("/dashboard/create-store")) {
      return true;
    }
    if (isConsumerAppPath(href)) return true;
    return vendorCanAccessPath(href, ctx.subscriptionActive, ctx.subscriptionTier, {
      isAdmin: false,
      hasSubscriptionRow: ctx.hasSubscriptionRow,
    });
  }

  return true;
}

export function getNavItemAccess(
  ctx: NavEntitlementContext,
  href: string
): NavItemAccess {
  // Admin: never show lock icons — full VENDOR_NAV + ADMIN_NAV unlocked
  if (ctx.role === "admin" || ctx.isAdmin) {
    return { allowed: true, locked: false, upgradeHref: UPGRADE_HREF };
  }

  const allowed = canAccessHref(ctx, href);
  const isVendor = ctx.role === "vendor" || ctx.isVendor;
  const locked = isVendor && !allowed && !isConsumerAppPath(href);
  return {
    allowed,
    locked,
    upgradeHref: UPGRADE_HREF,
  };
}

/** @deprecated Use mapNavItemsWithLocks — keeps items visible with lock state */
export function filterNavItemsByEntitlements<T extends NavLike>(
  items: T[],
  ctx: NavEntitlementContext
): T[] {
  return items;
}

export function mapNavItemsWithLocks<T extends NavLike>(
  items: T[],
  ctx: NavEntitlementContext
): Array<T & NavItemAccess> {
  return items.map((item) => ({
    ...item,
    ...getNavItemAccess(ctx, item.href),
  }));
}

export function filterNavGroupsByEntitlements(
  groups: NavGroup[],
  ctx: NavEntitlementContext
): NavGroup[] {
  return groups.map((group) => ({
    ...group,
    items: mapNavItemsWithLocks(group.items, ctx),
  }));
}

/** Creator Studio tiles — same rules as vendor nav; admin sees all unlocked. */
export function filterCreatorStudioTiles<T extends NavLike>(
  tiles: T[],
  ctx: Pick<
    NavEntitlementContext,
    "subscriptionActive" | "subscriptionTier" | "hasSubscriptionRow" | "isAdmin"
  >
): Array<T & NavItemAccess> {
  return mapNavItemsWithLocks(tiles, {
    role: ctx.isAdmin ? "admin" : "vendor",
    isVendor: !ctx.isAdmin,
    isAdmin: ctx.isAdmin,
    subscriptionActive: ctx.subscriptionActive,
    subscriptionTier: ctx.subscriptionTier,
    hasSubscriptionRow: ctx.hasSubscriptionRow,
  });
}

/** App sidebar / mobile nav shopper items (no subscription filter). */
export function filterAppNavItems<T extends NavLike>(
  items: T[],
  ctx: Pick<NavEntitlementContext, "isAdmin" | "isVendor">
): T[] {
  if (ctx.isAdmin) return items;
  return items;
}

export function mapNavItemToEntitlementCheck(item: NavItem, ctx: NavEntitlementContext): boolean {
  return canAccessHref(ctx, item.href);
}
