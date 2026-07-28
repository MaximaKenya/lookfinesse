import { supabase } from "@/lib/supabaseClient";

export async function computeTreasuryPressure() {
  const { data } = await supabase
    .from("ledger_entries")
    .select("*");

  if (!data) return null;

  const payoutVolume = data
    .filter((x) => x.type === "debit")
    .reduce(
      (sum, x) =>
        sum + Number(x.amount || 0),
      0
    );

  const incomingVolume = data
    .filter((x) => x.type === "credit")
    .reduce(
      (sum, x) =>
        sum + Number(x.amount || 0),
      0
    );

  const pressure =
    payoutVolume /
    Math.max(incomingVolume, 1);

  return {
    pressure,

    severity:
      pressure > 0.8
        ? "HIGH"
        : pressure > 0.5
        ? "MEDIUM"
        : "LOW",

    payoutVolume,

    incomingVolume,
  };
}