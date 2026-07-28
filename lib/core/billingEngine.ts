import { supabase } from "@/lib/supabaseClient";

export async function chargeSubscription(vendorId: string, planId: string) {
  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (!plan) throw new Error("Plan not found");

  await supabase.from("invoices").insert({
    vendor_id: vendorId,
    amount: plan.price,
    status: "pending",
  });

  return plan;
}