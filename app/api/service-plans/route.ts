import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendor_id");
  const serviceId = searchParams.get("service_id");

  const supabase = await createSupabaseServer();
  let q = supabase
    .from("service_plans")
    .select("*")
    .eq("is_active", true)
    .order("price_kes", { ascending: true });

  if (vendorId) q = q.eq("vendor_id", vendorId);
  if (serviceId) q = q.or(`service_id.eq.${serviceId},service_id.is.null`);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(Array.isArray(data) ? data : []);
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { vendor_id, service_id, name, description, price_kes, benefits, includes_live_classes } = body;

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("id", vendor_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("service_plans")
    .insert({
      vendor_id,
      service_id: service_id ?? null,
      name,
      description: description ?? null,
      price_kes: Number(price_kes),
      interval: "monthly",
      benefits: benefits ?? [],
      includes_live_classes: !!includes_live_classes,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
