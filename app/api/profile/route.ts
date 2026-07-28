import { NextResponse } from "next/server";

import { requireUser } from "@/lib/api/requireUser";
import { isNetworkError, supabaseUnreachableResponse } from "@/lib/api/supabaseRoute";



// GET /api/profile — current user profile

export async function GET() {

  const auth = await requireUser();

  if ("response" in auth) return auth.response;



  const { data, error } = await auth.supabase

    .from("user_profiles")

    .select("*")

    .eq("user_id", auth.user.id)

    .maybeSingle();



  if (error) {
    if (isNetworkError(error)) {
      return supabaseUnreachableResponse(error.message);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? {});

}



// PATCH /api/profile — upsert user profile (authenticated)

export async function PATCH(req: Request) {

  const auth = await requireUser();

  if ("response" in auth) return auth.response;



  const body = await req.json();

  const { user_id: _ignored, ...rest } = body;



  const ALLOWED = [

    "display_name", "bio", "avatar_url", "banner_url",

    "avatar_media_type", "banner_media_type",

    "avatar_carousel", "banner_carousel",

    "city", "lat", "lng",

    "onboarded_at",

  ] as const;

  const patch: Record<string, unknown> = {

    user_id: auth.user.id,

  };

  for (const key of ALLOWED) {

    if (key in rest) patch[key] = rest[key];

  }



  const needsPrefs =

    ("preferences" in rest && rest.preferences != null) || typeof rest.city === "string";

  let prevPrefs: Record<string, unknown> = {};

  if (needsPrefs) {

    const { data: existing } = await auth.supabase

      .from("user_profiles")

      .select("preferences")

      .eq("user_id", auth.user.id)

      .maybeSingle();

    prevPrefs = (existing?.preferences ?? {}) as Record<string, unknown>;

  }



  if ("preferences" in rest && rest.preferences != null) {

    const incoming = rest.preferences as Record<string, unknown>;

    patch.preferences = { ...prevPrefs, ...incoming };

    if (typeof incoming.city === "string" && !("city" in rest)) {

      patch.city = incoming.city;

    }

  }



  if (typeof rest.city === "string") {

    patch.preferences = { ...(patch.preferences as Record<string, unknown> ?? prevPrefs), city: rest.city };

  }



  const { data, error } = await auth.supabase

    .from("user_profiles")

    .upsert(patch, { onConflict: "user_id" })

    .select()

    .maybeSingle();



  if (error) return NextResponse.json({ error: error.message }, { status: 500 });



  if (rest.display_name || rest.avatar_url) {

    await auth.supabase.auth.updateUser({

      data: {

        ...(rest.display_name ? { display_name: rest.display_name } : {}),

        ...(rest.avatar_url ? { avatar_url: rest.avatar_url } : {}),

      },

    }).catch(() => {});

  }



  return NextResponse.json(data ?? patch);

}

