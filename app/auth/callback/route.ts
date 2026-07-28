import { NextResponse } from "next/server";

import { createSupabaseServer } from "@/lib/supabaseServer";

import { postSignupRedirect } from "@/lib/auth/onboarding";

import { getRequestOrigin } from "@/lib/url";



export async function GET(request: Request) {

  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");

  const returnUrl = searchParams.get("returnUrl") ?? "/feed";

  const origin = getRequestOrigin(request);



  if (code) {

    const supabase = await createSupabaseServer();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {

      const {

        data: { user },

      } = await supabase.auth.getUser();



      let dest = returnUrl;

      if (user) {

        const { data: profile } = await supabase

          .from("user_profiles")

          .select("onboarded_at, preferences")

          .eq("user_id", user.id)

          .maybeSingle();

        dest = postSignupRedirect(profile, returnUrl);

      }



      return NextResponse.redirect(`${origin}${dest}`);

    }

  }



  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);

}

