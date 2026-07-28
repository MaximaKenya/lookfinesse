export type FinanceEventType =
  | "PAYMENT_RECEIVED"
  | "ESCROW_HELD"
  | "ESCROW_RELEASED"
  | "PAYOUT_SENT"
  | "FRAUD_FLAGGED"
  | "REFUND_ISSUED";

const normalize = (event: string): string =>
  event.trim().toUpperCase().replace(/[\s-]/g, "_");

export const FinanceEventRegistry: Record<
  FinanceEventType,
  { label: string; type: "success" | "warning" | "danger" | "info" }
> = {
  PAYMENT_RECEIVED: { label: "Payment Received", type: "success" },
  ESCROW_HELD: { label: "Escrow Held", type: "info" },
  ESCROW_RELEASED: { label: "Escrow Released", type: "success" },
  PAYOUT_SENT: { label: "Payout Sent", type: "success" },
  FRAUD_FLAGGED: { label: "Fraud Alert", type: "danger" },
  REFUND_ISSUED: { label: "Refund Issued", type: "warning" },
};

export function formatEvent(event: string) {
  const key = normalize(event) as FinanceEventType;
  return FinanceEventRegistry[key]?.label || `Unknown Event: ${event}`;
}

export function getEventType(event: string) {
  const key = normalize(event) as FinanceEventType;
  return FinanceEventRegistry[key]?.type || "info";
}

export function isKnownEvent(event: string) {
  const key = normalize(event) as FinanceEventType;
  return key in FinanceEventRegistry;
}