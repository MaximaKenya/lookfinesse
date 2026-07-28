import { supabase } from "@/lib/supabaseClient";

import { logEvent } from "@/lib/events/logEvent";

import { FinancialEventType } from "@/lib/events/types";

export type LedgerType = "DEBIT" | "CREDIT";

interface LedgerEntryInput {
  vendor_id: string;
  payout_id?: string;
  type: LedgerType;
  amount: number;
  description?: string;
  reference?: string;
}

export async function postLedgerEntry(input: LedgerEntryInput) {
  const { vendor_id, type, amount } = input;

  // 1. Get current balance
  const { data: balance } = await supabase
    .from("vendor_balances")
    .select("*")
    .eq("vendor_id", vendor_id)
    .single();

  const current = balance?.available_balance ?? 0;

  // 2. Compute new balance
  const balance_before = current;

  const balance_after =
    type === "CREDIT"
      ? current + amount
      : current - amount;

  // 3. Insert ledger entry (IMMUTABLE RECORD)
const { data, error } = await supabase
  .from("ledger_entries")
  .insert([
    {
      vendor_id,
      payout_id: input.payout_id,
      type,
      amount,
      balance_before,
      balance_after,
      description: input.description,
      reference: input.reference,
    },
  ])
  .select()
  .single();

if (error) {
  throw error;
}

await logEvent({
  event_type:
    FinancialEventType.LEDGER_ENTRY_CREATED,

  entity_type: "vendor_ledger",

  entity_id: data.id,

  amount,

  metadata: {
    vendor_id,
    type,
    balance_before,
    balance_after,
  },
});

  // 4. Update vendor balance (derived state)
  await supabase
    .from("vendor_balances")
    .upsert({
      vendor_id,
      available_balance: balance_after,
      updated_at: new Date().toISOString(),
    });

  return { balance_before, balance_after };
}