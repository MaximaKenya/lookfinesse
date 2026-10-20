import { NextResponse } from "next/server";

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
 * Fail closed when the secret is missing or the header does not match.
 * Never throws — safe to import during `next build` with no env.
 */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization")?.trim() ?? "";
  return header === `Bearer ${secret}`;
}

export function cronUnauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
