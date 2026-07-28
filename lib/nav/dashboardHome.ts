/** Role-aware dashboard destination for logged-in users. */

export type DashboardRole = "admin" | "vendor" | "shopper";

export type DashboardNavItem = {
  href: string;
  label: string;
};

/**
 * Destination for the Dashboard CTA.
 * - admin → `/dashboard/admin`
 * - vendor / shopper → `/dashboard`
 * Never `/feed` or `/profile`.
 */
export function dashboardHomeHref(role: DashboardRole): string {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "vendor":
    case "shopper":
    default:
      return "/dashboard";
  }
}

export function resolveDashboardRole(isAdmin: boolean, isVendor: boolean): DashboardRole {
  if (isAdmin) return "admin";
  if (isVendor) return "vendor";
  return "shopper";
}

/** @deprecated Prefer resolveDashboardNav — kept for callers that gate on role only. */
export function showDashboardCta(_role: DashboardRole): boolean {
  return true;
}

/** Always "Dashboard" — never "My Space" (that label belongs to the profile nav group). */
export function dashboardCtaLabel(_role: DashboardRole): string {
  return "Dashboard";
}

/**
 * Always returns a Dashboard nav item for logged-in users.
 * Never maps to `/profile` or labels the CTA "My Space".
 */
export function resolveDashboardNav(input: {
  loggedIn: boolean;
  isAdmin: boolean;
  isVendor: boolean;
  roleLoading: boolean;
}): DashboardNavItem | null {
  if (!input.loggedIn) return null;

  // Optimistic while role loads — still Dashboard, never My Space
  if (input.roleLoading) {
    return { href: "/dashboard", label: "Dashboard" };
  }

  const role = resolveDashboardRole(input.isAdmin, input.isVendor);
  return {
    href: dashboardHomeHref(role),
    label: dashboardCtaLabel(role),
  };
}
