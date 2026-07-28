import { supabase } from "@/lib/supabaseClient";

export function subscribeToFinancialEvents(
  callback: (payload: any) => void
) {
  return supabase
    .channel("financial-events-live")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "financial_events" },
      callback
    )
    .subscribe();
}

export function subscribeToNotifications(
  userId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`notifications-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

export function subscribeToLiveTips(
  sessionId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`live-tips-${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "live_tips",
        filter: `session_id=eq.${sessionId}`,
      },
      callback
    )
    .subscribe();
}

export function subscribeToPayouts(
  callback: (payload: unknown) => void
) {
  return supabase
    .channel("live-payouts")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "payout_queue" },
      callback
    )
    .subscribe();
}

export function subscribeToFraud(
  callback: (payload: unknown) => void
) {
  return supabase
    .channel("live-fraud")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "fraud_events" },
      callback
    )
    .subscribe();
}