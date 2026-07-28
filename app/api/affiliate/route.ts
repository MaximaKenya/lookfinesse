import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { DEMO_VENDOR_ID } from "@/lib/creator/constants";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function logDevError(context: string, error: unknown) {
  if (process.env.NODE_ENV === "development") {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[affiliate] ${context}:`, message);
  }
}

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (error.message?.includes("affiliate_links") &&
      error.message?.includes("does not exist") === true)
  );
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// GET /api/affiliate?vendor_id=xxx — creator's affiliate links
// GET /api/affiliate?user_id=xxx&ref=xxx — track referral click
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendor_id");
    const userId = searchParams.get("user_id");
    const ref = searchParams.get("ref");

    const supabase = await createSupabaseServer();

    if (ref && userId) {
      const { data: link, error: linkError } = await supabase
        .from("affiliate_links")
        .select("id, vendor_id, clicks, conversions")
        .eq("code", ref)
        .maybeSingle();

      if (linkError) {
        if (isMissingTableError(linkError)) {
          return NextResponse.json({ tracked: false });
        }
        logDevError("GET track click", linkError);
        return jsonError(linkError.message, 400);
      }

      if (link) {
        await supabase
          .from("affiliate_links")
          .update({ clicks: (link.clicks ?? 0) + 1 })
          .eq("id", link.id);

        await supabase.from("affiliate_referrals").insert({
          affiliate_link_id: link.id,
          referred_user_id: userId,
          status: "clicked",
        });
      }

      return NextResponse.json({ tracked: !!link });
    }

    if (!vendorId) {
      return jsonError("Missing vendor_id or ref", 400);
    }

    if (!UUID_RE.test(vendorId)) {
      return jsonError("Invalid vendor_id", 400);
    }

    const { data, error } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingTableError(error)) {
        logDevError("GET links (missing table)", error);
        return NextResponse.json({ links: [] });
      }
      logDevError("GET links", error);
      return jsonError(error.message, 400);
    }

    return NextResponse.json({ links: data ?? [] });
  } catch (error) {
    logDevError("GET unhandled", error);
    return jsonError("Failed to fetch affiliate links", 500);
  }
}

// POST /api/affiliate — create affiliate link for creator
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonError("Invalid JSON body", 400);
    }

    const { vendor_id, commission_pct, description } = body as {
      vendor_id?: string;
      commission_pct?: number;
      description?: string;
    };

    if (!vendor_id) return jsonError("Missing vendor_id", 400);
    if (!UUID_RE.test(vendor_id)) return jsonError("Invalid vendor_id", 400);

    const supabase = await createSupabaseServer();

    // Demo vendor may not exist in vendors table — affiliate_links has no FK, so allow it.
    if (vendor_id !== DEMO_VENDOR_ID) {
      const { data: vendor, error: vendorError } = await supabase
        .from("vendors")
        .select("id")
        .eq("id", vendor_id)
        .maybeSingle();

      if (vendorError && !isMissingTableError(vendorError)) {
        logDevError("POST vendor lookup", vendorError);
        return jsonError(vendorError.message, 400);
      }

      if (!vendor && !isMissingTableError(vendorError)) {
        return jsonError("Vendor not found", 404);
      }
    }

    const code = `LF-${vendor_id.slice(0, 8).replace(/-/g, "").toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const { data, error } = await supabase
      .from("affiliate_links")
      .insert({
        vendor_id,
        code,
        commission_pct: commission_pct ?? 10,
        description: description ?? "Creator affiliate link",
        clicks: 0,
        conversions: 0,
      })
      .select()
      .single();

    if (error) {
      if (isMissingTableError(error)) {
        logDevError("POST create (missing table)", error);
        return jsonError(
          "Affiliate tables are not set up. Run migration 002_stories_affiliates_tips.sql.",
          503
        );
      }
      logDevError("POST create", error);
      return jsonError(error.message, 400);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    logDevError("POST unhandled", error);
    return jsonError("Failed to create affiliate link", 500);
  }
}
