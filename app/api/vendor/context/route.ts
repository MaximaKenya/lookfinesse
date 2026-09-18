import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { ensureVendorTrial } from "@/lib/subscriptions/ensureVendorTrial";
import { resolveVendorScope } from "@/lib/vendor/scope";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        vendorId: null,
        storeId: null,
        vendorName: null,
        hasVendorStore: false,
        isDemoMode: false,
      });
    }

    const [{ data: roleRows }, { data: vendor }, { data: store }, { data: profile }] =
      await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase
          .from("vendors")
          .select("id, business_name, name")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("stores").select("id, name").eq("user_id", user.id).limit(1).maybeSingle(),
        supabase.from("user_profiles").select("preferences").eq("user_id", user.id).maybeSingle(),
      ]);

    const roles = (roleRows ?? []).map((r) => r.role);
    const intended =
      (profile?.preferences as { intended_role?: string } | null)?.intended_role === "vendor";
    const alreadyVendor =
      roles.includes("vendor") || Boolean(vendor?.id) || Boolean(store?.id) || intended;

    if (alreadyVendor) {
      await ensureVendorTrial(supabase, user.id, {
        vendorId: vendor?.id,
        businessName: vendor?.business_name || vendor?.name || store?.name,
        email: user.email ?? null,
      });
    }

    const scope = await resolveVendorScope(supabase);
    if (!scope.ok) {
      return NextResponse.json({
        vendorId: null,
        storeId: store?.id ?? null,
        vendorName: store?.name ?? null,
        hasVendorStore: Boolean(store?.id),
        isDemoMode: false,
      });
    }

    const { data: named } = await supabase
      .from("vendors")
      .select("business_name, name")
      .eq("id", scope.scope.vendorId)
      .maybeSingle();

    return NextResponse.json({
      vendorId: scope.scope.vendorId,
      storeId: scope.scope.storeId,
      vendorName: named?.business_name || named?.name || store?.name || "Your Store",
      hasVendorStore: true,
      isDemoMode: false,
    });
  } catch (err) {
    console.error("[vendor/context]", err);
    return NextResponse.json(
      { error: "Failed to resolve vendor context", vendorId: null, hasVendorStore: false },
      { status: 500 }
    );
  }
}
