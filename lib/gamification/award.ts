import type { SupabaseClient } from "@supabase/supabase-js";

const BADGES: Record<string, { title: string; description: string; at: number }> = {
  first_purchase: { title: "First look", description: "Completed a first LookFinesse purchase.", at: 1 },
  booked_in: { title: "Booked in", description: "Paid for a service booking.", at: 1 },
  regular: { title: "Regular", description: "Earned 200 LookFinesse points.", at: 200 },
  dedicated: { title: "Dedicated", description: "Earned 500 LookFinesse points.", at: 500 },
};

/**
 * Add points and keep the daily streak. Safe to call after a verified payment.
 */
export async function awardPoints(
  db: SupabaseClient,
  userId: string | null | undefined,
  points: number,
  badgeType?: string
) {
  if (!userId || points <= 0) return;
  const today = new Date().toISOString().slice(0, 10);
  const { data: streak } = await db
    .from("user_streaks")
    .select("current_streak, longest_streak, last_active_date, points")
    .eq("user_id", userId)
    .maybeSingle();

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const continued = streak?.last_active_date === yesterday;
  const sameDay = streak?.last_active_date === today;
  const current = sameDay
    ? Number(streak?.current_streak ?? 1)
    : continued
      ? Number(streak?.current_streak ?? 0) + 1
      : 1;
  const longest = Math.max(current, Number(streak?.longest_streak ?? 0));
  const total = Number(streak?.points ?? 0) + points;

  await db.from("user_streaks").upsert(
    {
      user_id: userId,
      current_streak: current,
      longest_streak: longest,
      last_active_date: today,
      points: total,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  const grants = Object.entries(BADGES).filter(([, badge]) => total >= badge.at);
  if (badgeType && BADGES[badgeType]) grants.push([badgeType, BADGES[badgeType]]);

  for (const [type, badge] of grants) {
    await db.from("achievements").upsert(
      {
        user_id: userId,
        badge_type: type,
        title: badge.title,
        description: badge.description,
      },
      { onConflict: "user_id,badge_type", ignoreDuplicates: true }
    );
  }
}
