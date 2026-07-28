import { supabase } from "@/lib/supabaseClient";

export async function submitKYC(params: {
  vendor_id: string;
  full_name: string;
  country: string;
  document_type: string;
  document_number: string;
}) {
  await supabase.from("vendor_kyc").insert([
    {
      ...params,
      verification_status: "PENDING",
    },
  ]);

  return {
    success: true,
  };
}