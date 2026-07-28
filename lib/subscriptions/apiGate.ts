import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import {
  pathRequiresEliteTier,
  pathRequiresProTier,
  vendorCanAccessPath,
} from "@/lib/subscriptions/platformTiers";

export type VendorGateContext = {
  userId: string;
  isAdmin: boolean;
  isVendor: boolean;
  active: boolean;
  tier: string | null;
  hasRow: boolean;
};

export async function getVendorGateContext(): Promise<VendorGateContext | null> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = (roleRows ?? []).map((r) => r.role);
  const isAdmin = roles.includes("admin");
  let isVendor = roles.includes("vendor") || isAdmin;

  if (!isVendor) {
    const { data: stores } = await supabase
      .from("stores")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);
    if (stores && stores.length > 0) isVendor = true;
  }

  const { data: subRow } = await supabase
    .from("platform_subscriptions")
    .select("tier, status")
    .eq("user_id", user.id)
    .maybeSingle();

  const hasRow = !!subRow;
  const tier = subRow?.tier ?? null;
  const active = subRow?.status === "active";

  return { userId: user.id, isAdmin, isVendor, active, tier, hasRow };
}

export function gateDenied(
  ctx: VendorGateContext,
  pathname: string
): NextResponse | null {
  if (ctx.isAdmin) return null;
  if (!ctx.isVendor) {
    return NextResponse.json({ error: "Vendor access required" }, { status: 403 });
  }
  const allowed = vendorCanAccessPath(pathname, ctx.active, ctx.tier, {
    isAdmin: ctx.isAdmin,
    hasSubscriptionRow: ctx.hasRow,
  });
  if (allowed) return null;

  const needsElite = pathRequiresEliteTier(pathname);
  const needsPro = pathRequiresProTier(pathname);
  return NextResponse.json(
    {
      error: needsElite
        ? "Elite plan required"
        : needsPro
          ? "Pro or Elite plan required"
          : "Active vendor subscription required",
      code: needsElite ? "TIER_ELITE" : needsPro ? "TIER_PRO" : "SUBSCRIPTION_REQUIRED",
      upgradeHref: "/dashboard/subscription",
    },
    { status: 403 }
  );
}

/** Guard vendor API routes by logical dashboard path. */
export async function requireVendorEntitlement(
  logicalPath: string
): Promise<{ ctx: VendorGateContext } | NextResponse> {
  const ctx = await getVendorGateContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const denied = gateDenied(ctx, logicalPath);
  if (denied) return denied;
  return { ctx };
}
