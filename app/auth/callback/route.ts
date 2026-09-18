import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { postSignupRedirect } from "@/lib/auth/onboarding";
import { getRequestOrigin } from "@/lib/url";
import { bootstrapAccount } from "@/lib/auth/bootstrapAccount";
import { isPlatformAdmin } from "@/lib/auth/platformAdmin";

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
        const intended =
          (user.user_metadata as { intended_role?: string } | null)?.intended_role === "vendor"
            ? "vendor"
            : "shopper";
        await bootstrapAccount(supabase, user, { intendedRole: intended });

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("onboarded_at, preferences")
          .eq("user_id", user.id)
          .maybeSingle();

        const { data: roleRows } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        const roles = (roleRows ?? []).map((r) => r.role);
        const skipOnboarding =
          isPlatformAdmin({
            email: user.email,
            roles,
            appMetadata: (user.app_metadata ?? null) as Record<string, unknown> | null,
          }) || roles.includes("vendor");

        dest = postSignupRedirect(profile, returnUrl, { skipOnboarding });
      }

      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
