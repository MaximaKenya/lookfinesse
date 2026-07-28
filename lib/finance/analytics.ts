import { supabase } from "@/lib/supabaseClient";

export type Granularity =
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";

export type RevenuePoint = {
  label: string;
  revenue: number;
};

function formatLabel(dateStr: string, granularity: Granularity) {
  const d = new Date(dateStr);

  switch (granularity) {
    case "hourly":
      return `${d.getHours()}:00`;
    case "daily":
      return d.toISOString().split("T")[0];
    case "weekly":
      return `W${getWeek(d)}`;
    case "monthly":
      return d.toLocaleString("default", { month: "short" });
    case "yearly":
      return String(d.getFullYear());
  }
}

function getWeek(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
}

export async function getRevenueAnalytics(granularity: Granularity) {
  const { data, error } = await supabase.rpc(
    "get_revenue_analytics",
    {
      granularity,
    }
  );

  if (error) {
    console.error(error);
    return [];
  }

  return (data || []).map((row: any) => ({
    label: formatLabel(row.bucket, granularity),
    revenue: Number(row.revenue || 0),
  }));
}