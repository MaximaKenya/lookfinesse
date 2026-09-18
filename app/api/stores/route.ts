import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { ensureVendorTrial } from "@/lib/subscriptions/ensureVendorTrial";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Store name is required" }, { status: 400 });
    }

    const lat = Number(body.latitude);
    const lng = Number(body.longitude);
    const city = String(body.city ?? "").trim() || null;
    const address = String(body.address ?? "").trim() || null;

    const insert: Record<string, unknown> = {
      user_id: user.id,
      name,
      description: String(body.description ?? "").trim() || null,
      ownerName: String(body.ownerName ?? "").trim() || null,
      phone: String(body.phone ?? "").trim() || null,
      city,
      address,
      latitude: Number.isFinite(lat) && lat !== 0 ? lat : null,
      longitude: Number.isFinite(lng) && lng !== 0 ? lng : null,
      location: city || address,
    };

    const { data: store, error } = await supabase
      .from("stores")
      .insert(insert)
      .select("id, name, city")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const trial = await ensureVendorTrial(supabase, user.id, {
      businessName: name,
      email: user.email ?? null,
    });

    return NextResponse.json(
      {
        success: true,
        store,
        vendorId: trial.vendorId,
        trial: { status: trial.status, tier: trial.tier },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[stores POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create store" },
      { status: 500 }
    );
  }
}
