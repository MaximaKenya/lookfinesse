import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data: sessions, error } = await supabase
    .from("live_sessions")
    .select(
      "id, vendor_id, title, description, scheduled_for, is_live, viewer_count, tip_total, cover_url"
    )
    .order("scheduled_for", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const vendorIds = [...new Set((sessions ?? []).map((s) => s.vendor_id))];
  const { data: vendors } =
    vendorIds.length > 0
      ? await supabase
          .from("vendors")
          .select("id, business_name, name")
          .in("id", vendorIds)
      : { data: [] };

  const nameById = new Map(
    (vendors ?? []).map((v) => [v.id, v.business_name ?? v.name ?? "Vendor"])
  );

  return NextResponse.json({
    sessions: (sessions ?? []).map((s) => ({
      ...s,
      vendor_name: nameById.get(s.vendor_id) ?? s.vendor_id,
    })),
    empty: (sessions ?? []).length === 0,
  });
}
