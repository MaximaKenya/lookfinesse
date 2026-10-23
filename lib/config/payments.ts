/**
 * Live Paystack stays off until business registration lands.
 * Default is false. Set PAYMENTS_ENABLED=true to resume checkout.
 * Paystack code itself stays in the repo either way.
 */
export function paymentsEnabled(): boolean {
  const value = process.env.PAYMENTS_ENABLED?.trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}
