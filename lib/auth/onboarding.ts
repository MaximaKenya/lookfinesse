export type UserPreferences = {
  interests?: string[];
  budget?: string;
  style?: string;
  gender?: string;
  age_group?: string;
  city?: string;
  intended_role?: "shopper" | "vendor" | string;
};

export function isProfileOnboarded(profile: {
  onboarded_at?: string | null;
  preferences?: UserPreferences | null;
} | null | undefined): boolean {
  if (!profile) return false;
  if (profile.onboarded_at) return true;
  const prefs = profile.preferences ?? {};
  return (
    Array.isArray(prefs.interests) &&
    prefs.interests.length > 0 &&
    !!prefs.gender &&
    !!prefs.age_group
  );
}

export function destinationAfterOnboarding(
  preferences?: UserPreferences | null
): string {
  if (preferences?.intended_role === "vendor") return "/dashboard/create-store";
  return "/feed";
}

export function postSignupRedirect(
  profile: { onboarded_at?: string | null; preferences?: UserPreferences | null } | null,
  returnUrl = "/feed",
  opts?: { skipOnboarding?: boolean; isVendor?: boolean }
): string {
  if (opts?.skipOnboarding || isProfileOnboarded(profile)) {
    const vendorHome =
      opts?.isVendor || profile?.preferences?.intended_role === "vendor";
    if (vendorHome && (returnUrl === "/onboarding" || returnUrl === "/feed" || returnUrl === "/")) {
      return opts?.isVendor ? "/dashboard" : "/dashboard/create-store";
    }
    if (returnUrl === "/onboarding") return "/feed";
    return returnUrl || "/feed";
  }
  return "/onboarding";
}

/** Hard navigation so auth cookies are included on the next request (proxy). */
export function hardNavigate(path: string) {
  if (typeof window === "undefined") return;
  window.location.assign(path);
}
