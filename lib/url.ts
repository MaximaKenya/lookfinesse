/**
 * Resolve the app base URL for server-side redirects and payment callbacks.
 * Prefers the incoming request origin (works on LAN IPs during mobile testing).
 */
export function getRequestOrigin(req: Request): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost ?? req.headers.get("host");
  const proto =
    req.headers.get("x-forwarded-proto") ??
    (host?.includes("localhost") || host?.match(/^\d+\.\d+\.\d+\.\d+/)
      ? "http"
      : "https");

  if (host) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  try {
    return new URL(req.url).origin;
  } catch {
    return getEnvBaseUrl();
  }
}

/** Fallback when no request is available (cron, scripts). */
export function getEnvBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (env && env !== "http://localhost:3000") return env;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return env ?? "http://localhost:3000";
}

/** Client-only origin — never call during SSR render. */
export function getClientOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}
