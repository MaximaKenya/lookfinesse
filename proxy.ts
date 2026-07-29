import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createEdgeSupabase, readEdgeSessionUserFromCookies } from "@/lib/auth/edgeAuth";
import { isPlatformAdmin } from "@/lib/auth/platformAdmin";
import { vendorCanAccessPath } from "@/lib/subscriptions/platformTiers";

/** Routes that require a signed-in session at the edge. */
const HARD_AUTH_REQUIRED = ["/checkout", "/onboarding"];

const ADMIN_ROUTES = ["/admin", "/finance", "/intelligence", "/dashboard/admin"];

/** Deeper vendor / creator surfaces — tier-gated except subscription & create-store. */
const VENDOR_ROUTE_PREFIXES = [
  "/vendor",
  "/dashboard/ads",
  "/dashboard/calendar",
  "/dashboard/create-live",
  "/dashboard/create-product",
  "/dashboard/create-service",
  "/dashboard/create-post",
  "/dashboard/create-reel",
  "/dashboard/creator-studio",
  "/dashboard/finance",
  "/dashboard/vendor",
  "/dashboard/categories",
];

/**
 * Hub prefixes that need auth + role awareness.
 * Exact `/dashboard` is shopper-reachable (upgrade CTA) — NEVER redirect to /feed.
 */
const VENDOR_HUB_PREFIXES = ["/dashboard", "/vendor"];

const SHOPPER_AUTH_ROUTES = ["/onboarding"];

const VENDOR_ALWAYS_OPEN = ["/dashboard/subscription", "/dashboard/create-store"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isVendorAlwaysOpen(pathname: string): boolean {
  return VENDOR_ALWAYS_OPEN.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/** Dashboard home — shoppers land here; must never bounce to /feed. */
function isDashboardEntry(pathname: string): boolean {
  return pathname === "/dashboard";
}

function loginRedirect(request: NextRequest, pathname: string, response?: NextResponse) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("returnUrl", pathname);
  const redirect = NextResponse.redirect(loginUrl);
  if (response) {
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value));
  }
  return redirect;
}

/**
 * API routes must NEVER hit auth redirects (those return HTML login pages).
 * Callers expect JSON — a 302 → /login breaks `res.json()` with Unexpected token '<'.
 */
function shouldSkip(pathname: string): boolean {
  if (pathname === "/api" || pathname.startsWith("/api/")) return true;
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/auth") ||
    pathname === "/logout" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
    !!pathname.match(/\.(ico|png|svg|jpg|jpeg|gif|webp|woff|woff2|ttf|mp4|webm)$/)
  );
}

function needsAuthWork(pathname: string): boolean {
  return (
    matchesPrefix(pathname, HARD_AUTH_REQUIRED) ||
    matchesPrefix(pathname, SHOPPER_AUTH_ROUTES) ||
    matchesPrefix(pathname, ADMIN_ROUTES) ||
    matchesPrefix(pathname, VENDOR_HUB_PREFIXES)
  );
}

function withSessionCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => to.cookies.set(c.name, c.value));
  return to;
}

function devLogRedirect(from: string, to: string, reason: string) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[proxy] redirect ${from} → ${to} (${reason})`);
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hard skip for every /api/* request — no HTML redirects, no tier gates
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  if (!needsAuthWork(pathname)) {
    return NextResponse.next();
  }

  const user = await readEdgeSessionUserFromCookies(request);

  const needsAdmin = matchesPrefix(pathname, ADMIN_ROUTES);
  const needsVendorHub =
    matchesPrefix(pathname, VENDOR_HUB_PREFIXES) && !isVendorAlwaysOpen(pathname);
  const needsHardAuth =
    matchesPrefix(pathname, HARD_AUTH_REQUIRED) ||
    matchesPrefix(pathname, SHOPPER_AUTH_ROUTES);

  if (needsHardAuth) {
    if (!user) {
      return loginRedirect(request, pathname);
    }
    return NextResponse.next();
  }

  if (!needsAdmin && !needsVendorHub) {
    return NextResponse.next();
  }

  // Auth missing on dashboard / vendor / admin → login (never silent /feed bounce)
  if (!user) {
    devLogRedirect(pathname, "/login", "unauthenticated");
    return loginRedirect(request, pathname);
  }

  try {
    const { supabase, getResponse } = createEdgeSupabase(request);
    const sessionResponse = getResponse();

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roles = (roleRows ?? []).map((r) => r.role);
    const isAdmin = isPlatformAdmin({
      email: user.email,
      roles,
      appMetadata: (user.app_metadata ?? null) as Record<string, unknown> | null,
    });
    let isVendor = roles.includes("vendor") || isAdmin;

    if (!isVendor) {
      const { data: stores } = await supabase
        .from("stores")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      if (stores && stores.length > 0) isVendor = true;
    }

    // Admin: full bypass — every dashboard, vendor, admin route (no tier redirects)
    if (isAdmin) {
      return sessionResponse;
    }

    if (needsAdmin) {
      if (isVendor) {
        devLogRedirect(pathname, "/vendor", "vendor blocked from admin");
        return withSessionCookies(
          sessionResponse,
          NextResponse.redirect(new URL("/vendor", request.url))
        );
      }
      // Shopper hitting admin → dashboard home with upgrade CTA (never /feed)
      devLogRedirect(pathname, "/dashboard", "shopper blocked from admin");
      return withSessionCookies(
        sessionResponse,
        NextResponse.redirect(new URL("/dashboard", request.url))
      );
    }

    // Shopper on vendor hub:
    // - Exact /dashboard → allow (page shows vendor-features upgrade CTA)
    // - Deeper vendor tools → /dashboard (never /feed)
    if (needsVendorHub && !isVendor) {
      if (isDashboardEntry(pathname)) {
        return sessionResponse;
      }
      // Prefer dashboard entry over /feed so Dashboard CTA never "vanishes"
      const dest = "/dashboard";
      devLogRedirect(pathname, dest, "shopper blocked from vendor surface");
      return withSessionCookies(
        sessionResponse,
        NextResponse.redirect(new URL(dest, request.url))
      );
    }

    // Vendor tier gating via platform subscription
    if (isVendor && needsVendorHub) {
      // Dashboard home is always reachable for vendors (analytics / limited view)
      if (isDashboardEntry(pathname)) {
        return sessionResponse;
      }

      // Only apply path-tier checks to known vendor route prefixes
      if (matchesPrefix(pathname, VENDOR_ROUTE_PREFIXES) || pathname.startsWith("/vendor")) {
        // Prefer user_id; fall back to vendors row if subscription was keyed by vendor only
        let { data: subRow } = await supabase
          .from("platform_subscriptions")
          .select("tier, status, current_period_end")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!subRow) {
          const { data: vendorRow } = await supabase
            .from("vendors")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          if (vendorRow?.id) {
            const byVendor = await supabase
              .from("platform_subscriptions")
              .select("tier, status, current_period_end")
              .eq("vendor_id", vendorRow.id)
              .maybeSingle();
            subRow = byVendor.data;
          }
        }

        const hasRow = !!subRow;
        const tier = subRow?.tier ?? null;
        const periodOk =
          !subRow?.current_period_end ||
          new Date(subRow.current_period_end) > new Date();
        // trialing = full Pro/Elite access until current_period_end
        const active =
          (subRow?.status === "active" || subRow?.status === "trialing") &&
          periodOk;

        const allowed = vendorCanAccessPath(pathname, active, tier, {
          isAdmin: false,
          hasSubscriptionRow: hasRow,
        });

        if (!allowed) {
          devLogRedirect(pathname, "/dashboard/subscription", "vendor tier gate");
          return withSessionCookies(
            sessionResponse,
            NextResponse.redirect(new URL("/dashboard/subscription", request.url))
          );
        }
      }
    }

    return sessionResponse;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  // Exclude all /api/* (and static assets) so API handlers always return JSON
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api(?:/|$)).*)",
  ],
};
