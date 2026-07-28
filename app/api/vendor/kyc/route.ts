import { NextResponse } from "next/server";

import { createSupabaseServer } from "@/lib/supabaseServer";
import { resolveVendorScope } from "@/lib/vendor/scope";

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const scopeResult = await resolveVendorScope(supabase);

  if (!scopeResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { full_name, id_number, document_url } = await req.json();

  const { error } = await supabase.from("vendor_kyc").upsert({
    vendor_id: scopeResult.scope.vendorId,
    full_name,
    id_number,
    document_url,
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ message: "KYC submitted" });
}
