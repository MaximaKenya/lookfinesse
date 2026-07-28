import { supabase } from "@/lib/supabaseClient";

/** Mark booking paid/confirmed after successful payment. */
export async function syncBookingPayment(
  bookingId: string,
  paymentMethod: "mpesa" | "stripe"
): Promise<void> {
  const now = new Date().toISOString();
  await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      payment_status: "paid",
      payment_method: paymentMethod,
      paid_at: now,
      updated_at: now,
    })
    .eq("id", bookingId)
    .in("payment_status", ["pending"]);
}
