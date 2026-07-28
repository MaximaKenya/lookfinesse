export const FinancialEventType = {
  PAYMENT_SUCCESS: "payment_success",
  PAYMENT_FAILED: "payment_failed",

  ORDER_CREATED: "order_created",
  ORDER_PAID: "order_paid",
  ORDER_FAILED: "order_failed",

  PAYOUT_COMPLETED: "payout_completed",
  PAYOUT_FAILED: "payout_failed",

  REFUND_ISSUED: "refund_issued",

  LEDGER_ENTRY_CREATED: "ledger_entry_created",

  FRAUD_DETECTED: "fraud_detected",

  LIQUIDITY_LOW: "liquidity_low",

  VENDOR_RISK_SPIKE: "vendor_risk_spike",

  COPILOT_ALERT_GENERATED:
    "copilot_alert_generated",
} as const;

export interface LedgerEntry {
  id: string;

  amount: number;

  geo_location?: string;

  failed_attempts?: number;

  is_new_device?: boolean;

  geo_velocity_flag?: boolean;

  risk_score?: number;
}