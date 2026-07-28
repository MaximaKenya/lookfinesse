// /lib/finance/metrics.ts

export type LedgerEntry = {
  amount: number;
  category?: string;
  created_at?: string;
};

export type MetricsResult = {
  totalRevenue: number;
  totalFees: number;
  netRevenue: number;
  averageTransaction: number;
  transactionCount: number;
  profitMargin: number;
  last24hRevenue: number;
  last7dRevenue: number;
};

export function computeMetrics(entries: LedgerEntry[]): MetricsResult {
  if (!entries || entries.length === 0) {
    return {
      totalRevenue: 0,
      totalFees: 0,
      netRevenue: 0,
      averageTransaction: 0,
      transactionCount: 0,
      profitMargin: 0,
      last24hRevenue: 0,
      last7dRevenue: 0,
    };
  }

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let totalRevenue = 0;
  let totalFees = 0;
  let last24hRevenue = 0;
  let last7dRevenue = 0;

  for (const e of entries) {
    const amount = Number(e.amount) || 0;

    // Revenue
    if (e.category === "sale") {
      totalRevenue += amount;
    }

    // Fees
    if (e.category === "fee") {
      totalFees += amount;
    }

    // Time-based metrics
    if (e.created_at) {
      const date = new Date(e.created_at);

      if (date >= dayAgo && e.category === "sale") {
        last24hRevenue += amount;
      }

      if (date >= weekAgo && e.category === "sale") {
        last7dRevenue += amount;
      }
    }
  }

  const transactionCount = entries.length;
  const averageTransaction = totalRevenue / (transactionCount || 1);
  const netRevenue = totalRevenue - totalFees;

  const profitMargin =
    totalRevenue > 0 ? (netRevenue / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalFees,
    netRevenue,
    averageTransaction,
    transactionCount,
    profitMargin,
    last24hRevenue,
    last7dRevenue,
  };
}