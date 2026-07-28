import { NextRequest, NextResponse } from "next/server";

import { getPersonalizedAds } from "@/lib/ads/getPersonalizedAds";

import { guardSupabaseEnv, isNetworkError } from "@/lib/api/supabaseRoute";



export const runtime = "nodejs";



/**

 * GET /api/ads/serve

 * Query params:

 *   user_id   - authenticated user id (optional)

 *   session_id - anonymous session token for freq-cap (optional)

 *   location  - user city/region for geo targeting (optional)

 *   limit     - number of ads to return (default 6)

 *   placement - hero_carousel | feed_inline (default hero_carousel)

 */

export async function GET(req: NextRequest) {

  if (guardSupabaseEnv()) {

    return NextResponse.json([], {

      headers: { "Cache-Control": "private, max-age=30" },

    });

  }



  const { searchParams } = req.nextUrl;

  const userId = searchParams.get("user_id") ?? undefined;

  const sessionId = searchParams.get("session_id") ?? undefined;

  const location = searchParams.get("location") ?? undefined;

  const limit = Math.min(Number(searchParams.get("limit") ?? "6"), 20);



  try {

    const ads = await getPersonalizedAds({ userId, sessionId, location, limit });



    return NextResponse.json(ads, {

      headers: {

        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",

      },

    });

  } catch (err) {

    if (isNetworkError(err)) {

      return NextResponse.json([], {

        headers: { "Cache-Control": "private, max-age=30" },

      });

    }

    console.error("[ads/serve]", err);

    return NextResponse.json([], { status: 200 });

  }

}


