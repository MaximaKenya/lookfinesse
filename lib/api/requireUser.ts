import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

import {
  guardSupabaseEnv,
  isNetworkError,
  supabaseUnreachableResponse,
} from "@/lib/api/supabaseRoute";
import { createSupabaseServer } from "@/lib/supabaseServer";

export async function requireUser(): Promise<
  | { supabase: Awaited<ReturnType<typeof createSupabaseServer>>; user: User }
  | { response: NextResponse }
> {
  const envGuard = guardSupabaseEnv();
  if (envGuard) return { response: envGuard };

  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    return { supabase, user };
  } catch (err) {
    if (isNetworkError(err)) {
      return { response: supabaseUnreachableResponse(err instanceof Error ? err.message : undefined) };
    }
    throw err;
  }
}
