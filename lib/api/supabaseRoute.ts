import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

export function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) {
    const msg = err.message.toLowerCase();
    return msg.includes("fetch") || msg.includes("network");
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("fetch failed") ||
      msg.includes("enotfound") ||
      msg.includes("econnrefused") ||
      msg.includes("network") ||
      msg.includes("getaddrinfo")
    );
  }
  return false;
}

export function supabaseEnvErrorResponse() {
  const env = getSupabaseEnv();
  return NextResponse.json(
    {
      error: "Supabase is not configured",
      code: "SUPABASE_MISCONFIGURED",
      issues: env.ok ? [] : env.issues,
    },
    { status: 503 }
  );
}

export function supabaseUnreachableResponse(detail?: string) {
  return NextResponse.json(
    {
      error: "Database temporarily unavailable",
      code: "SUPABASE_UNREACHABLE",
      detail,
    },
    { status: 503 }
  );
}

/** Returns a 503 response when public Supabase env vars are invalid; otherwise null. */
export function guardSupabaseEnv(): NextResponse | null {
  const env = getSupabaseEnv();
  if (!env.ok) return supabaseEnvErrorResponse();
  return null;
}
