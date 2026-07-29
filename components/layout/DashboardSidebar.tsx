"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Menu,
  X,
  Lock,
  type LucideIcon,
} from "lucide-react";

import { ADMIN_NAV, VENDOR_NAV, type NavGroup, type NavItem } from "@/lib/nav/dashboards";
import { filterNavGroupsByEntitlements } from "@/lib/nav/filterNavByEntitlements";
import type { NavItemAccess } from "@/lib/nav/filterNavByEntitlements";
import { usePlatformSubscription } from "@/hooks/usePlatformSubscription";
import { useUserRole } from "@/hooks/useUserRole";

import BrandLogo from "@/components/brand/BrandLogo";
import SubscriptionTierBadge from "@/components/vendor/SubscriptionTierBadge";

type Props = {
  variant: "admin" | "vendor";
  brand: {
    title: string;
    subtitle: string;
    badge?: string;
    accent?: string;
  };
  footer?: {
    label: string;
    helper?: string;
    href: string;
  };
};

const NAV_BY_VARIANT: Record<Props["variant"], NavGroup[]> = {
  admin: ADMIN_NAV,
  vendor: VENDOR_NAV,
};

function NavLink({
  href,
  label,
  description,
  icon: Icon,
  accent,
  active,
  onSelect,
  locked,
  upgradeHref,
}: NavItem & NavItemAccess & {
  active: boolean;
  onSelect?: () => void;
}) {
  // Force unlocked when access says allowed — never show lock for unlocked items
  const isLocked = locked === true;
  const target = isLocked ? upgradeHref : href;
  return (
    <Link
      href={target}
      onClick={onSelect}
      className={`group flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm transition-all ${
        active
          ? "border-white/15 bg-white/10 text-white shadow-inner shadow-black/30"
          : isLocked
            ? "border-transparent text-zinc-400 hover:border-amber-500/20 hover:bg-amber-500/5 hover:text-amber-100"
            : "border-transparent dashboard-nav-link hover:border-white/10 hover:bg-white/5"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-black/40 ${
          active ? "border-white/15" : ""
        }`}
      >
        <Icon className={`h-4 w-4 ${accent ?? "text-zinc-200"}`} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold leading-tight truncate">{label}</span>
        {description && (
          <span className="block text-[11px] dashboard-nav-desc leading-tight truncate">
            {description}
          </span>
        )}
      </span>
      {isLocked ? (
        <Lock className="h-3.5 w-3.5 shrink-0 text-amber-400/80" />
      ) : (
      <ChevronRight
        className={`h-3.5 w-3.5 shrink-0 transition-all ${
          active ? "text-white/60 translate-x-0.5" : "text-zinc-700 group-hover:text-zinc-400"
        }`}
      />
      )}
    </Link>
  );
}

/** Merge admin + vendor nav: unique keys, dedupe by href, rename Finance groups. */
function mergeNavGroups(
  primary: NavGroup[],
  secondary: NavGroup[],
  financeLabels: { primary: string; secondary: string }
): NavGroup[] {
  const seenHrefs = new Set<string>();
  const out: NavGroup[] = [];

  const pushGroups = (
    groups: NavGroup[],
    financeLabel: string
  ) => {
    for (const group of groups) {
      const items = group.items.filter((item) => {
        if (seenHrefs.has(item.href)) return false;
        seenHrefs.add(item.href);
        return true;
      });
      if (items.length === 0) continue;
      out.push({
        ...group,
        title: group.title === "Finance" ? financeLabel : group.title,
        items,
      });
    }
  };

  pushGroups(primary, financeLabels.primary);
  pushGroups(secondary, financeLabels.secondary);
  return out;
}

function NavBody({
  groups,
  pathname,
  onSelect,
}: {
  groups: NavGroup[];
  pathname: string;
  onSelect?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-6 scrollbar-hide">
      {groups.map((group, index) => (
        <div key={`${group.title}-${index}`}>
          <p className="dashboard-nav-label px-3 pb-2">
            {group.title}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href + "/"));
              return (
                <li key={item.href}>
                  <NavLink
                    {...item}
                    active={active}
                    onSelect={onSelect}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function DashboardSidebar({ variant, brand, footer }: Props) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const { active, tier, hasRow, isAdmin: subIsAdmin } = usePlatformSubscription();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const adminUnlocked = isAdmin || subIsAdmin;

  const groups = useMemo(() => {
    // Admin: every vendor + admin nav item, all unlocked — never show lock icons
    if (adminUnlocked) {
      const merged =
        variant === "admin"
          ? mergeNavGroups(ADMIN_NAV, VENDOR_NAV, {
              primary: "Platform Finance",
              secondary: "Vendor Finance",
            })
          : mergeNavGroups(VENDOR_NAV, ADMIN_NAV, {
              primary: "Vendor Finance",
              secondary: "Platform Finance",
            });
      return filterNavGroupsByEntitlements(merged, {
        role: "admin",
        isAdmin: true,
        isVendor: true,
        subscriptionActive: true,
        subscriptionTier: "elite",
        hasSubscriptionRow: true,
      });
    }

    // While role resolves, show base nav without locks (avoid admin flash as locked)
    const base = NAV_BY_VARIANT[variant];
    if (variant === "admin") return base;
    if (roleLoading) {
      return base.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          allowed: true,
          locked: false,
          upgradeHref: "/dashboard/subscription",
        })),
      }));
    }
    return filterNavGroupsByEntitlements(base, {
      role: "vendor",
      isVendor: true,
      isAdmin: false,
      subscriptionActive: active,
      subscriptionTier: tier,
      hasSubscriptionRow: hasRow,
    });
  }, [variant, active, tier, hasRow, adminUnlocked, roleLoading]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-72 flex-col border-r border-white/8 bg-black/80 backdrop-blur-xl">
        <div className="px-5 py-5 border-b border-white/8 space-y-4">
          <BrandLogo href="/feed" size="sm" />
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 ${
                brand.accent ?? "text-green-300"
              } font-black`}
            >
              {brand.title.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold tracking-tight truncate">
                {brand.title}
              </div>
              <div className="text-[11px] text-zinc-500 truncate">{brand.subtitle}</div>
            </div>
          </div>
          {brand.badge && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-green-300">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                {brand.badge}
              </div>
              {variant === "vendor" && <SubscriptionTierBadge />}
            </div>
          )}
        </div>

        <NavBody groups={groups} pathname={pathname} />

        <div className="mt-auto border-t border-white/8 p-3 space-y-2">
          <Link
            href="/feed"
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-medium text-zinc-400 hover:text-white hover:border-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
          {footer && (
            <Link
              href={footer.href}
              className="flex flex-col rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
            >
              <span>{footer.label}</span>
              {footer.helper && (
                <span className="mt-0.5 text-[11px] font-normal text-cyan-200/70">
                  {footer.helper}
                </span>
              )}
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/8 bg-black/80 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-2 min-w-0">
          <BrandLogo href="/feed" variant="icon" size="sm" />
          <span className="truncate max-w-[120px] text-sm font-semibold">{brand.title}</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:text-white"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
      </header>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`lg:hidden fixed inset-y-0 right-0 z-[60] flex w-80 max-w-[88vw] flex-col bg-[#0a0a0a] border-l border-white/10 transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="font-bold">{brand.title}</div>
            <div className="text-[11px] text-zinc-500">{brand.subtitle}</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <NavBody
          groups={groups}
          pathname={pathname}
          onSelect={() => setOpen(false)}
        />
        <div className="border-t border-white/10 p-3 space-y-2">
          <Link
            href="/feed"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-medium text-zinc-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
        </div>
      </div>
    </>
  );
}
