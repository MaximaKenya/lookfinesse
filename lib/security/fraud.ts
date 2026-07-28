import { supabase } from "@/lib/supabaseClient";
import { Payment } from "@/lib/types/payment";

export async function detectFraud(payment: Payment) {
  const { data: recent } = await supabase
    .from("payments")
    .select("*")
    .eq("phone", payment.phone)
    .order("created_at", { ascending: false })
    .limit(5);

  if (recent && recent.length >= 5) {
    return { flagged: true, reason: "Too many attempts" };
  }

  if (payment.amount > 100000) {
    return { flagged: true, reason: "High value anomaly" };
  }

  return { flagged: false };
}