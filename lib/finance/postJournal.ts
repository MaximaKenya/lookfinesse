import { supabase } from "@/lib/supabaseClient";

type Entry = {
  account_id: string;
  type: "debit" | "credit";
  amount: number;
  category?: string;
  metadata?: any;
};

// 🔍 Extract tenant from account_id
function extractTenant(accountId: string): string {
  // format: escrow:vendorId OR cash:platform
  const parts = accountId.split(":");

  if (parts.length > 1) {
    return parts[1];
  }

  return "platform"; // fallback
}

export async function postJournal({
  reference,
  description,
  entries,
}: {
  reference: string;
  description: string;
  entries: Entry[];
}) {
  // =========================================
  // 1. VALIDATE DOUBLE ENTRY
  // =========================================
  const debitTotal = entries
    .filter((e) => e.type === "debit")
    .reduce((sum, e) => sum + e.amount, 0);

  const creditTotal = entries
    .filter((e) => e.type === "credit")
    .reduce((sum, e) => sum + e.amount, 0);

  if (debitTotal !== creditTotal) {
    throw new Error("❌ Ledger imbalance (debits != credits)");
  }

  // =========================================
  // 2. CREATE JOURNAL ENTRY
  // =========================================
  const { data: journal, error } = await supabase
    .from("journal_entries")
    .insert({
      reference,
      description,
    })
    .select()
    .single();

  if (error || !journal) throw error;

  // =========================================
  // 3. INSERT LEDGER LINES (WITH TENANT)
  // =========================================
  const rows = entries.map((e) => ({
    journal_id: journal.id,
    account_id: e.account_id,
    type: e.type,
    amount: e.amount,
    category: e.category || null,
    metadata: e.metadata || null,
    tenant_id: extractTenant(e.account_id), // 🔥 CRITICAL
  }));

  const { error: ledgerError } = await supabase
    .from("ledger_entries")
    .insert(rows);

  if (ledgerError) throw ledgerError;

  

  return journal;
}