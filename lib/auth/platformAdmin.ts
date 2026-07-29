/** Seed / docs platform admin — always full entitlement bypass. */
export const PLATFORM_ADMIN_EMAIL = "admin@test.com";

export function isPlatformAdminEmail(email?: string | null): boolean {
  return (email ?? "").toLowerCase().trim() === PLATFORM_ADMIN_EMAIL;
}

/**
 * True when the user is a platform admin via:
 * - user_roles.role = admin
 * - email = admin@test.com
 * - JWT / app_metadata.role = admin
 */
export function isPlatformAdmin(opts: {
  email?: string | null;
  roles?: readonly string[] | null;
  appMetadata?: Record<string, unknown> | null;
}): boolean {
  if (isPlatformAdminEmail(opts.email)) return true;
  if (opts.roles?.includes("admin")) return true;
  if (opts.appMetadata?.role === "admin") return true;
  return false;
}
