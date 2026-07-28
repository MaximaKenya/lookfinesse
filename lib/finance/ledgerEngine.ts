import { supabase } from "@/lib/supabaseClient";


import { logEvent } from "@/lib/events/logEvent";

import { FinancialEventType } from "@/lib/events/types";

type Entry = {
  account_id: string;
  type: "debit" | "credit";
  amount: number;
  category?: string;
  metadata?: any;
};

export async function postJournal({
  reference,
  description,
  entries,
}: {
  reference: string;
  description: string;
  entries: Entry[];
}) {
  // 🔒 1. PRECISION SAFE VALIDATION (no float bugs)
  const round = (n: number) => Math.round(n * 100);

  const debitTotal = entries
    .filter(e => e.type === "debit")
    .reduce((a, b) => a + round(b.amount), 0);

  const creditTotal = entries
    .filter(e => e.type === "credit")
    .reduce((a, b) => a + round(b.amount), 0);

  if (debitTotal !== creditTotal) {
    throw new Error(
      `Ledger imbalance detected: debits=${debitTotal} credits=${creditTotal}`
    );
  }

  // 🔁 2. CREATE JOURNAL ENTRY (SOURCE OF TRUTH)
  const { data: journal, error: journalError } = await supabase
    .from("journal_entries")
    .insert({
      reference,
      description,
    })
    .select()
    .single();

  if (journalError || !journal) throw journalError;

  // 🧾 3. BUILD LEDGER LINES (IMMUTABLE)
  const ledgerLines = entries.map(e => ({
    journal_id: journal.id,
    account_id: e.account_id,
    type: e.type,
    amount: e.amount,
    category: e.category ?? null,
    metadata: e.metadata ?? null,
  }));

  const { error: ledgerError } = await supabase
    .from("ledger_entries")
    .insert(ledgerLines);

  if (ledgerError) {
    throw new Error("Ledger insert failed: " + ledgerError.message);
  }

  await logEvent({
  event_type:
    FinancialEventType.LEDGER_ENTRY_CREATED,

  entity_type: "journal",

  entity_id: journal.id,

  amount: debitTotal / 100,

  metadata: {
    reference,
    description,
    entry_count: entries.length,
  },
});

  // 💰 4. UPDATE ACCOUNTS (SAFE DELTA APPLICATION)
  for (const e of entries) {
    const delta = e.type === "credit" ? e.amount : -e.amount;

    const { error } = await supabase.rpc("increment_account_balance", {
      account_id: e.account_id,
      amount: delta,
    });

    if (error) {
      throw new Error(
        `Account update failed for ${e.account_id}: ${error.message}`
      );
    }
  }

  return journal;
}