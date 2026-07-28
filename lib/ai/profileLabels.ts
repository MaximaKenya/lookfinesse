import type { UserPreferences } from "@/lib/auth/onboarding";
import { isProfileOnboarded } from "@/lib/auth/onboarding";

const GENDER_LABELS: Record<string, string> = {
  female: "woman",
  male: "man",
  non_binary: "non-binary",
  prefer_not: "prefer not to say",
};

const AGE_LABELS: Record<string, string> = {
  "18-24": "18–24",
  "25-34": "25–34",
  "35-44": "35+",
  "45-54": "45+",
  "55+": "55+",
  "35+": "35+",
  "age-35-plus": "35+",
};

export function formatGenderLabel(gender?: string | null): string | null {
  if (!gender) return null;
  const key = gender.toLowerCase().replace(/\s+/g, "_");
  return GENDER_LABELS[key] ?? gender.replace(/_/g, " ");
}

export function formatAgeGroupLabel(ageGroup?: string | null): string | null {
  if (!ageGroup) return null;
  const key = ageGroup.toLowerCase();
  if (AGE_LABELS[key]) return AGE_LABELS[key];
  if (key.includes("35") || key.includes("44") || key.includes("45") || key.includes("55")) {
    return "35+";
  }
  return ageGroup.replace(/-/g, "–").replace(/_/g, " ");
}

export function formatPrefsSummary(
  preferences: UserPreferences = {},
  city?: string | null
): string | null {
  const parts: string[] = [];
  const gender = formatGenderLabel(preferences.gender);
  const age = formatAgeGroupLabel(preferences.age_group);
  const location = city ?? preferences.city ?? null;

  if (gender) parts.push(gender);
  if (age) parts.push(age);
  if (location) parts.push(location);

  return parts.length ? parts.join(" · ") : null;
}

export function hasMeaningfulPrefs(
  preferences: UserPreferences = {},
  profile?: { onboarded_at?: string | null; preferences?: UserPreferences | null } | null
): boolean {
  if (isProfileOnboarded(profile ?? { preferences })) return true;
  return !!(preferences.gender && preferences.age_group);
}

export function prefsForPrompt(preferences: UserPreferences = {}, city?: string | null) {
  return {
    gender: preferences.gender ?? null,
    age_group: preferences.age_group ?? null,
    age_label: formatAgeGroupLabel(preferences.age_group),
    gender_label: formatGenderLabel(preferences.gender),
    style: preferences.style ?? null,
    interests: preferences.interests ?? [],
    city: city ?? preferences.city ?? null,
  };
}
