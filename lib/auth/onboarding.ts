export type UserPreferences = {
  interests?: string[];
  budget?: string;
  style?: string;
  gender?: string;
  age_group?: string;
  city?: string;
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

export function postSignupRedirect(
  profile: { onboarded_at?: string | null; preferences?: UserPreferences | null } | null,
  returnUrl = "/feed"
): string {
  if (isProfileOnboarded(profile)) return returnUrl === "/onboarding" ? "/feed" : returnUrl;
  return "/onboarding";
}
