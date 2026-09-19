/** Map Supabase / GoTrue errors into shopper-friendly copy. */
export function friendlyAuthError(raw: string | null | undefined): string {
  const msg = (raw ?? "").trim();
  const lower = msg.toLowerCase();

  if (!msg || lower.includes("supabase_misconfigured")) {
    return "Sign-up is temporarily unavailable — the app is not connected to its database. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";
  }
  if (lower.includes("already registered") || lower.includes("already been registered") || lower.includes("user already registered")) {
    return "An account with this email already exists. Sign in, or reset your password if you forgot it.";
  }
  if (lower.includes("identities") && lower.includes("0")) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Email or password is incorrect. Try again, or reset your password.";
  }
  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return "Please confirm your email first — check your inbox (and spam) for the LookFinesse link. You can resend it from the sign-up screen.";
  }
  if (lower.includes("password") && (lower.includes("least") || lower.includes("short") || lower.includes("weak"))) {
    return "Password must be at least 8 characters and include a letter and a number.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (lower.includes("provider") && (lower.includes("not enabled") || lower.includes("unsupported"))) {
    return "Google sign-in is not enabled yet. Use email and password, or ask an admin to enable Google in Supabase.";
  }
  if (lower.includes("failed to fetch") || lower.includes("network") || lower.includes("enotfound")) {
    return "Cannot reach LookFinesse servers. Check your connection and that the Supabase project is running.";
  }
  return msg;
}

export function isDuplicateSignup(user: { identities?: { id?: string }[] | null } | null | undefined): boolean {
  if (!user) return false;
  return Array.isArray(user.identities) && user.identities.length === 0;
}

export function validateSignupInput(opts: {
  email: string;
  password: string;
  username: string;
}): string | null {
  const email = opts.email.trim();
  const username = opts.username.trim();
  if (username.length < 2) return "Choose a username with at least 2 characters.";
  if (username.length > 32) return "Username must be 32 characters or fewer.";
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    return "Username can only include letters, numbers, dots, hyphens, and underscores.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  if (opts.password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(opts.password) || !/\d/.test(opts.password)) {
    return "Password must include at least one letter and one number.";
  }
  return null;
}

export type IntendedAccountKind = "shopper" | "vendor";

export const INTENDED_ROLE_KEY = "lf_intended_role";

export function persistIntendedRole(kind: IntendedAccountKind) {
  try {
    localStorage.setItem(INTENDED_ROLE_KEY, kind);
  } catch {
    /* ignore */
  }
}

export function readIntendedRole(): IntendedAccountKind {
  try {
    const v = localStorage.getItem(INTENDED_ROLE_KEY);
    if (v === "vendor") return "vendor";
  } catch {
    /* ignore */
  }
  return "shopper";
}

export function clearIntendedRole() {
  try {
    localStorage.removeItem(INTENDED_ROLE_KEY);
  } catch {
    /* ignore */
  }
}
