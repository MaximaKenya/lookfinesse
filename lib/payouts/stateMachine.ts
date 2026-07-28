export const PayoutStatus = {
  PENDING: "PENDING",
  QUEUED: "QUEUED",
  PROCESSING: "PROCESSING",
  SENT: "SENT",
  FAILED: "FAILED",
  RETRY_SCHEDULED: "RETRY_SCHEDULED",
} as const;

export type PayoutStatusType =
  (typeof PayoutStatus)[keyof typeof PayoutStatus];