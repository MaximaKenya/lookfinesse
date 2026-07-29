import { createServerClient } from "@supabase/ssr";
import { combineChunks, stringFromBase64URL } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

import { isPlatformAdmin } from "@/lib/auth/platformAdmin";

export type EdgeAuth = {
  userId: string | null;
  isAdmin: boolean;
  isVendor: boolean;
};

const BASE64_PREFIX = "base64-";

function decodeAuthCookieValue(value: string): string | null {
  if (!value.startsWith(BASE64_PREFIX)) {
    return value;
  }
  try {
    return stringFromBase64URL(value.slice(BASE64_PREFIX.length));
  } catch {
    return null;
  }
}

/**
 * Read session user from sb-*-auth-token cookies only — no network fetch.
 * Safe at the edge when Supabase is unreachable or the token is expired.
 */
export async function readEdgeSessionUserFromCookies(
  request: NextRequest
): Promise<User | null> {
  const all = request.cookies.getAll();
  const storageKey =
    all.find((c) => c.name.includes("auth-token") && !/\.\d+$/.test(c.name))?.name ??
    null;
  if (!storageKey) return null;

  const combined = await combineChunks(storageKey, (chunkName) => {
    const cookie = all.find((c) => c.name === chunkName);
    return cookie?.value ?? null;
  });
  if (!combined) return null;

  const decoded = decodeAuthCookieValue(combined);
  if (!decoded) return null;

  try {
    const session = JSON.parse(decoded) as { user?: User | null };
    return session?.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Edge Supabase client for proxy.ts (Next.js 16 middleware replacement).
 *
 * Cookie flow:
 * - Browser client (createBrowserClient) writes sb-*-auth-token[.N] via document.cookie
 * - proxy reads them with getAll(); prefer readEdgeSessionUserFromCookies() at edge
 * - Only call getSession() when refresh is required — it may hit the network on expiry
 */
export function createEdgeSupabase(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, getResponse: () => response };
}

/** Session from cookies; optional network refresh only when allowRefresh is true. */
export async function getEdgeSessionUser(
  supabase: ReturnType<typeof createEdgeSupabase>["supabase"],
  request?: NextRequest,
  options?: { allowRefresh?: boolean }
): Promise<User | null> {
  if (request) {
    const fromCookies = await readEdgeSessionUserFromCookies(request);
    if (fromCookies && !options?.allowRefresh) {
      return fromCookies;
    }
  }

  if (!options?.allowRefresh) {
    return request ? readEdgeSessionUserFromCookies(request) : null;
  }

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      return request ? readEdgeSessionUserFromCookies(request) : null;
    }
    return session?.user ?? null;
  } catch {
    return request ? readEdgeSessionUserFromCookies(request) : null;
  }
}

export async function getEdgeAuth(request: NextRequest): Promise<EdgeAuth & { response: NextResponse }> {
  const user = await readEdgeSessionUserFromCookies(request);

  if (!user) {
    return { userId: null, isAdmin: false, isVendor: false, response: NextResponse.next() };
  }

  try {
    const { supabase, getResponse } = createEdgeSupabase(request);

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roles = (roleRows ?? []).map((r) => r.role);
    let isAdmin = isPlatformAdmin({
      email: user.email,
      roles,
      appMetadata: (user.app_metadata ?? null) as Record<string, unknown> | null,
    });
    let isVendor = roles.includes("vendor") || isAdmin;

    if (!isVendor) {
      const { data: stores } = await supabase
        .from("stores")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      if (stores && stores.length > 0) isVendor = true;
    }

    return { userId: user.id, isAdmin, isVendor, response: getResponse() };
  } catch {
    const isAdmin = isPlatformAdmin({
      email: user.email,
      appMetadata: (user.app_metadata ?? null) as Record<string, unknown> | null,
    });
    return {
      userId: user.id,
      isAdmin,
      isVendor: isAdmin,
      response: NextResponse.next(),
    };
  }
}
