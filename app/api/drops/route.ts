import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

function missing(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (error.message?.includes("flash_drops") && error.message.includes("does not exist"))
  );
}

const DEMO_DROPS = [
  {
    id: "demo-drop-1",
    title: "Weekend Flash — Ankara Sets",
    description: "48-hour drop with live reel countdown",
    starts_at: new Date(Date.now() - 3600_000).toISOString(),
    ends_at: new Date(Date.now() + 86_400_000).toISOString(),
    sale_price: 2500,
    currency: "KES",
    hold_qty: 3,
    max_holds: 40,
    status: "live",
    products: { id: "demo", name: "Ankara Co-ord", image_url: null },
    vendors: { name: "Nairobi Atelier" },
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendor_id");
    const status = searchParams.get("status");

    const supabase = await createSupabaseServer();
    let q = supabase
      .from("flash_drops")
      .select("*, products ( id, name, image_url, price ), vendors ( id, name, business_name )")
      .order("starts_at", { ascending: true })
      .limit(40);

    if (vendorId) q = q.eq("vendor_id", vendorId);
    if (status) q = q.eq("status", status);

    const { data, error } = await q;
    if (error) {
      if (missing(error)) return NextResponse.json({ drops: DEMO_DROPS, demo: true });
      return NextResponse.json({ drops: DEMO_DROPS, demo: true, error: error.message });
    }

    // Auto-mark live/ended based on window
    const now = Date.now();
    const drops = (data ?? []).map((d) => {
      const start = new Date(d.starts_at).getTime();
      const end = new Date(d.ends_at).getTime();
      let st = d.status;
      if (st !== "cancelled") {
        if (now >= start && now <= end) st = "live";
        else if (now > end) st = "ended";
        else st = "scheduled";
      }
      return { ...d, status: st };
    });

    return NextResponse.json({ drops: drops.length ? drops : DEMO_DROPS, demo: drops.length === 0 });
  } catch {
    return NextResponse.json({ drops: DEMO_DROPS, demo: true });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createSupabaseServer();

    if (body.action === "waitlist") {
      const { drop_id, user_id } = body;
      if (!drop_id || !user_id) {
        return NextResponse.json({ error: "Missing drop_id or user_id" }, { status: 400 });
      }
      const { error } = await supabase.from("drop_waitlist").upsert(
        { drop_id, user_id },
        { onConflict: "drop_id,user_id" }
      );
      if (error && !missing(error)) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ ok: true, waitlisted: true });
    }

    if (body.action === "hold") {
      const { drop_id, product_id, user_id, qty = 1 } = body;
      if (!drop_id || !user_id) {
        return NextResponse.json({ error: "Missing drop_id or user_id" }, { status: 400 });
      }
      const expires = new Date(Date.now() + 15 * 60_000).toISOString();
      const { data: drop } = await supabase.from("flash_drops").select("*").eq("id", drop_id).maybeSingle();
      if (drop && Number(drop.hold_qty ?? 0) >= Number(drop.max_holds ?? 50)) {
        return NextResponse.json({ error: "Hold capacity full" }, { status: 409 });
      }
      const { error } = await supabase.from("inventory_holds").insert({
        drop_id,
        product_id: product_id ?? drop?.product_id,
        user_id,
        qty,
        expires_at: expires,
        status: "held",
      });
      if (error && !missing(error)) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (drop) {
        await supabase
          .from("flash_drops")
          .update({ hold_qty: Number(drop.hold_qty ?? 0) + Number(qty) })
          .eq("id", drop_id);
      }
      return NextResponse.json({ ok: true, held: true, expires_at: expires });
    }

    // Create drop
    const {
      vendor_id,
      product_id,
      title,
      description,
      starts_at,
      ends_at,
      sale_price,
      max_holds,
      live_session_id,
    } = body;

    if (!vendor_id || !title || !starts_at || !ends_at) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("flash_drops")
      .insert({
        vendor_id,
        product_id: product_id || null,
        title,
        description: description || null,
        starts_at,
        ends_at,
        sale_price: sale_price ?? null,
        max_holds: max_holds ?? 50,
        live_session_id: live_session_id || null,
        status: "scheduled",
      })
      .select("*")
      .single();

    if (error) {
      if (missing(error)) {
        return NextResponse.json({
          ok: true,
          demo: true,
          drop: { id: "demo-local", title, starts_at, ends_at, status: "scheduled" },
          note: "Run migration 027 to persist drops",
        });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, drop: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Drop action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
