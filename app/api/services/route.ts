import { NextResponse } from "next/server";
import { getServices } from "@/lib/social/queries";
import { requireVendorSession } from "@/lib/vendor/requireVendorSession";

export async function GET(req: Request) {
  const category = new URL(req.url).searchParams.get("category") ?? undefined;
  const services = await getServices(category ?? undefined);
  return NextResponse.json(services);
}

export async function POST(req: Request) {
  try {
    const session = await requireVendorSession();
    if (!session.ok) return session.response;

    const { supabase, scope } = session;
    const body = await req.json();
    const {
      title,
      short_description,
      description,
      category,
      cover_image,
      price,
      duration_minutes,
      is_virtual,
      is_in_person,
      max_participants,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Service title is required" }, { status: 400 });
    }
    if (price === undefined || price === null || price === "") {
      return NextResponse.json({ error: "Price is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("services")
      .insert({
        vendor_id: scope.vendorId,
        title: title.trim(),
        short_description: short_description || title.trim(),
        description: description || short_description || title.trim(),
        category: category || null,
        cover_image: cover_image || null,
        price: Number(price),
        duration_minutes: Number(duration_minutes) || 60,
        is_virtual: Boolean(is_virtual),
        is_in_person: is_in_person !== false,
        max_participants: Number(max_participants) || 1,
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, service: data }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create service" },
      { status: 500 }
    );
  }
}
