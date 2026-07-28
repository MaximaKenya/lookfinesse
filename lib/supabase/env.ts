const SUPABASE_URL_RE = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i;

export type SupabaseEnvResult =
  | { ok: true; url: string; anonKey: string }
  | { ok: false; issues: string[] };

function readEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "",
  };
}

/** Validate Supabase public env vars (format only — does not ping the network). */
export function validateSupabaseEnv(): SupabaseEnvResult {
  const { url, anonKey } = readEnv();
  const issues: string[] = [];

  if (!url) {
    issues.push("NEXT_PUBLIC_SUPABASE_URL is missing");
  } else if (!SUPABASE_URL_RE.test(url.replace(/\/$/, ""))) {
    issues.push(
      "NEXT_PUBLIC_SUPABASE_URL must be https://<project-ref>.supabase.co (no trailing slash)"
    );
  }

  if (!anonKey) {
    issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
  } else if (anonKey.length < 20) {
    issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY looks invalid (too short)");
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true, url: url.replace(/\/$/, ""), anonKey };
}

export function isSupabaseConfigured(): boolean {
  return validateSupabaseEnv().ok;
}

export function getSupabaseEnv(): SupabaseEnvResult {
  return validateSupabaseEnv();
}

export function getSupabaseEnvIssues(): string[] {
  const env = validateSupabaseEnv();
  return env.ok ? [] : env.issues;
}
