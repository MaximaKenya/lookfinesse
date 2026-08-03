/** Heuristic demand signals from sales velocity + engagement proxies. */

export type DemandSignal = {
  signal_type: "restock" | "promote" | "drop" | "hold";
  title: string;
  rationale: string;
  score: number;
  product_id?: string | null;
  product_name?: string;
};

type ProductRow = {
  id: string;
  name?: string | null;
  stock_quantity?: number | null;
  stock?: number | null;
  sku?: string | null;
  price?: number | null;
  view_count?: number | null;
  sales_count?: number | null;
  engagement_score?: number | null;
};

export function buildDemandSignals(products: ProductRow[]): DemandSignal[] {
  const signals: DemandSignal[] = [];

  for (const p of products) {
    const stock = Number(p.stock_quantity ?? p.stock ?? 0);
    const sales = Number(p.sales_count ?? 0);
    const views = Number(p.view_count ?? 0);
    const eng = Number(p.engagement_score ?? 0);
    const name = p.name ?? "Product";

    if (stock <= 5 && (sales > 0 || views > 10)) {
      signals.push({
        signal_type: "restock",
        title: `Restock ${name}`,
        rationale: `Only ${stock} left with recent demand (sales ${sales}, views ${views}).`,
        score: 90 - stock * 5 + Math.min(sales, 20),
        product_id: p.id,
        product_name: name,
      });
    }

    if (eng >= 10 || views >= 50) {
      if (stock > 10) {
        signals.push({
          signal_type: "promote",
          title: `Promote ${name}`,
          rationale: `Strong feed interest (engagement ${eng}, views ${views}) — boost with ads or a reel.`,
          score: 50 + Math.min(eng, 40),
          product_id: p.id,
          product_name: name,
        });
      }
    }

    if (stock >= 20 && sales < 2 && views < 15) {
      signals.push({
        signal_type: "hold",
        title: `Pause push on ${name}`,
        rationale: "High stock, low velocity — avoid over-promoting until demand returns.",
        score: 30,
        product_id: p.id,
        product_name: name,
      });
    }
  }

  // Weekend drop suggestion if any product has mid stock + engagement
  const dropCandidate = products
    .filter((p) => Number(p.stock_quantity ?? p.stock ?? 0) >= 8)
    .sort((a, b) => Number(b.engagement_score ?? 0) - Number(a.engagement_score ?? 0))[0];

  if (dropCandidate) {
    signals.push({
      signal_type: "drop",
      title: `Drop ${dropCandidate.name ?? "hero SKU"} this weekend`,
      rationale: "Schedule a flash drop or live session while inventory supports a timed offer.",
      score: 70,
      product_id: dropCandidate.id,
      product_name: dropCandidate.name ?? undefined,
    });
  }

  if (signals.length === 0) {
    signals.push({
      signal_type: "promote",
      title: "Seed your catalog",
      rationale: "Add products or link them to reels/stories to unlock restock and drop signals.",
      score: 10,
    });
  }

  return signals.sort((a, b) => b.score - a.score).slice(0, 12);
}
