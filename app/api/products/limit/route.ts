import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { checkVendorProductLimit } from "@/lib/subscriptions/productLimits";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { isPlatformAdmin } from "@/lib/auth/platformAdmin";

async function resolveIsAdmin(): Promise<boolean> {
  try {
    const server = await createSupabaseServer();
    const {
      data: { user },
    } = await server.auth.getUser();
    if (!user) return false;
    const { data: roleRows } = await server
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    return isPlatformAdmin({
      email: user.email,
      roles: (roleRows ?? []).map((r) => r.role),
      appMetadata: (user.app_metadata ?? null) as Record<string, unknown> | null,
    });
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const vendorId = new URL(req.url).searchParams.get("vendor_id");
  if (!vendorId) {
    return NextResponse.json({ error: "vendor_id required" }, { status: 400 });
  }

  const isAdmin = await resolveIsAdmin();
  const check = await checkVendorProductLimit(supabase, vendorId, { isAdmin });
  return NextResponse.json(check);
}
