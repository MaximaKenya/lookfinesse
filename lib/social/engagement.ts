import { createSupabaseServer } from "@/lib/supabaseServer";
import { trackBehavior } from "@/lib/ai/trackBehavior";
import { updateInterestProfile } from "@/lib/ai/updateInterestProfile";
import type { ReactionType } from "@/lib/types/social";

async function db() {
  return createSupabaseServer();
}

export async function toggleFollow(followerId: string, vendorId: string) {
  const supabase = await db();
  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("vendor_id", vendorId)
    .maybeSingle();

  if (existing) {
    await supabase.from("follows").delete().eq("id", existing.id);
    return { following: false };
  }

  await supabase.from("follows").insert({ follower_id: followerId, vendor_id: vendorId });
  await trackBehavior({
    userId: followerId,
    entityType: "vendor",
    entityId: vendorId,
    eventType: "follow",
  });
  return { following: true };
}

export async function isFollowing(followerId: string, vendorId: string) {
  const supabase = await db();
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("vendor_id", vendorId)
    .maybeSingle();
  return !!data;
}

/** One reaction per user per post/reel; changing emoji updates the row; same emoji toggles off. */
export async function upsertReaction(params: {
  userId: string;
  postId?: string;
  reelId?: string;
  reactionType: ReactionType;
}) {
  const supabase = await db();
  const { userId, postId, reelId, reactionType } = params;

  let existingQuery = supabase.from("post_reactions").select("id, reaction_type").eq("user_id", userId);
  if (postId) existingQuery = existingQuery.eq("post_id", postId);
  else if (reelId) existingQuery = existingQuery.eq("reel_id", reelId);

  const { data: existing } = await existingQuery.maybeSingle();

  if (existing) {
    if (existing.reaction_type === reactionType) {
      await supabase.from("post_reactions").delete().eq("id", existing.id);
      return { added: false, reaction_type: null as ReactionType | null };
    }
    await supabase
      .from("post_reactions")
      .update({ reaction_type: reactionType })
      .eq("id", existing.id);
    return { added: true, reaction_type: reactionType, changed: true };
  }

  const { error } = await supabase.from("post_reactions").insert({
    user_id: userId,
    post_id: postId ?? null,
    reel_id: reelId ?? null,
    reaction_type: reactionType,
  });

  if (error) throw error;

  await trackBehavior({
    userId,
    entityType: postId ? "feed_post" : "reel",
    entityId: postId ?? reelId,
    eventType: "react",
    metadata: { reaction_type: reactionType },
  });

  return { added: true, reaction_type: reactionType };
}

/** @deprecated Use upsertReaction */
export const toggleReaction = upsertReaction;

export type ReactionSummary = {
  reaction_type: ReactionType;
  count: number;
};

export async function getReactionSummaries(params: {
  postId?: string;
  reelId?: string;
  userId?: string;
}): Promise<{ counts: ReactionSummary[]; userReaction: ReactionType | null }> {
  const supabase = await db();
  let query = supabase.from("post_reactions").select("user_id, reaction_type");

  if (params.postId) query = query.eq("post_id", params.postId);
  else if (params.reelId) query = query.eq("reel_id", params.reelId);

  const { data: rows } = await query;
  const list = rows ?? [];

  const byType = new Map<ReactionType, Set<string>>();
  let userReaction: ReactionType | null = null;

  for (const row of list) {
    const type = row.reaction_type as ReactionType;
    if (!byType.has(type)) byType.set(type, new Set());
    byType.get(type)!.add(row.user_id);
    if (params.userId && row.user_id === params.userId) userReaction = type;
  }

  const counts: ReactionSummary[] = [];
  byType.forEach((users, reaction_type) => {
    counts.push({ reaction_type, count: users.size });
  });

  return { counts, userReaction };
}

export async function addComment(params: {
  userId: string;
  postId?: string;
  reelId?: string;
  content: string;
}) {
  const supabase = await db();
  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      user_id: params.userId,
      post_id: params.postId ?? null,
      reel_id: params.reelId ?? null,
      content: params.content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getComments(postId?: string, reelId?: string) {
  const supabase = await db();
  let query = supabase
    .from("post_comments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (postId) query = query.eq("post_id", postId);
  else if (reelId) query = query.eq("reel_id", reelId);

  const { data } = await query;
  return data ?? [];
}

export async function getCommentCount(postId?: string, reelId?: string): Promise<number> {
  const supabase = await db();
  let query = supabase
    .from("post_comments")
    .select("id", { count: "exact", head: true });

  if (postId) query = query.eq("post_id", postId);
  else if (reelId) query = query.eq("reel_id", reelId);

  const { count } = await query;
  return count ?? 0;
}

/** Batched engagement for feed list — avoids N+1 /api/reactions + /api/comments. */
export type FeedPostEngagement = {
  reaction_counts: Partial<Record<ReactionType, number>>;
  reaction_count: number;
  comment_count: number;
  user_reaction: ReactionType | null;
};

export async function getFeedEngagementBatch(params: {
  postIds: string[];
  userId?: string;
}): Promise<Map<string, FeedPostEngagement>> {
  const result = new Map<string, FeedPostEngagement>();
  const ids = [...new Set(params.postIds.filter(Boolean))];
  for (const id of ids) {
    result.set(id, {
      reaction_counts: {},
      reaction_count: 0,
      comment_count: 0,
      user_reaction: null,
    });
  }
  if (ids.length === 0) return result;

  try {
    const supabase = await db();
    const [{ data: reactions }, { data: comments }] = await Promise.all([
      supabase
        .from("post_reactions")
        .select("post_id, user_id, reaction_type")
        .in("post_id", ids),
      supabase.from("post_comments").select("post_id").in("post_id", ids),
    ]);

    for (const row of reactions ?? []) {
      const postId = row.post_id as string;
      const entry = result.get(postId);
      if (!entry) continue;
      const type = row.reaction_type as ReactionType;
      entry.reaction_counts[type] = (entry.reaction_counts[type] ?? 0) + 1;
      entry.reaction_count += 1;
      if (params.userId && row.user_id === params.userId) {
        entry.user_reaction = type;
      }
    }

    for (const row of comments ?? []) {
      const postId = row.post_id as string;
      const entry = result.get(postId);
      if (!entry) continue;
      entry.comment_count += 1;
    }
  } catch (err) {
    console.error("[getFeedEngagementBatch]", err);
  }

  return result;
}

/** Batched engagement for reels list — same N+1 fix as feed. */
export async function getReelEngagementBatch(params: {
  reelIds: string[];
  userId?: string;
}): Promise<Map<string, FeedPostEngagement>> {
  const result = new Map<string, FeedPostEngagement>();
  const ids = [...new Set(params.reelIds.filter(Boolean))];
  for (const id of ids) {
    result.set(id, {
      reaction_counts: {},
      reaction_count: 0,
      comment_count: 0,
      user_reaction: null,
    });
  }
  if (ids.length === 0) return result;

  try {
    const supabase = await db();
    const [{ data: reactions }, { data: comments }] = await Promise.all([
      supabase
        .from("post_reactions")
        .select("reel_id, user_id, reaction_type")
        .in("reel_id", ids),
      supabase.from("post_comments").select("reel_id").in("reel_id", ids),
    ]);

    for (const row of reactions ?? []) {
      const reelId = row.reel_id as string;
      const entry = result.get(reelId);
      if (!entry) continue;
      const type = row.reaction_type as ReactionType;
      entry.reaction_counts[type] = (entry.reaction_counts[type] ?? 0) + 1;
      entry.reaction_count += 1;
      if (params.userId && row.user_id === params.userId) {
        entry.user_reaction = type;
      }
    }

    for (const row of comments ?? []) {
      const reelId = row.reel_id as string;
      const entry = result.get(reelId);
      if (entry) entry.comment_count += 1;
    }
  } catch (err) {
    console.error("[getReelEngagementBatch]", err);
  }

  return result;
}

export async function toggleSave(params: {
  userId: string;
  postId?: string;
  reelId?: string;
  collectionId?: string;
}) {
  const supabase = await db();
  const filter = params.postId
    ? { user_id: params.userId, post_id: params.postId }
    : { user_id: params.userId, reel_id: params.reelId };

  const { data: existing } = await supabase
    .from("saved_posts")
    .select("id")
    .match(filter)
    .maybeSingle();

  if (existing) {
    await supabase.from("saved_posts").delete().eq("id", existing.id);
    return { saved: false };
  }

  await supabase.from("saved_posts").insert({
    user_id: params.userId,
    post_id: params.postId ?? null,
    reel_id: params.reelId ?? null,
    collection_id: params.collectionId ?? null,
  });

  await trackBehavior({
    userId: params.userId,
    entityType: params.postId ? "feed_post" : "reel",
    entityId: params.postId ?? params.reelId,
    eventType: "save",
  });

  await updateInterestProfile({ userId: params.userId, category: "saved", weight: 5 }).catch(() => {});

  return { saved: true };
}

export async function getSavedPosts(userId: string) {
  const supabase = await db();
  const { data } = await supabase
    .from("saved_posts")
    .select(`
      *,
      feed_posts ( *, vendors(name, avatar_url), products(name, price) ),
      reels ( *, vendors(name, avatar_url) )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getCollections(userId: string) {
  const supabase = await db();
  const { data } = await supabase
    .from("collections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createCollection(userId: string, name: string, description?: string) {
  const supabase = await db();
  const { data, error } = await supabase
    .from("collections")
    .insert({ user_id: userId, name, description })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getNotifications(userId: string) {
  const supabase = await db();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  const supabase = await db();
  let query = supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId);

  if (ids?.length) query = query.in("id", ids);

  await query;
}

export async function getUserStreak(userId: string) {
  const supabase = await db();
  const { data } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function recordDailyActivity(userId: string) {
  const supabase = await db();
  const today = new Date().toISOString().split("T")[0];
  const { data: streak } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!streak) {
    await supabase.from("user_streaks").insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_active_date: today,
    });
    return { current_streak: 1 };
  }

  if (streak.last_active_date === today) return streak;

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const continued = streak.last_active_date === yesterday;
  const current = continued ? streak.current_streak + 1 : 1;
  const longest = Math.max(current, streak.longest_streak);

  await supabase
    .from("user_streaks")
    .update({
      current_streak: current,
      longest_streak: longest,
      last_active_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return { current_streak: current, longest_streak: longest };
}

export async function getChallenges() {
  const supabase = await db();
  const { data } = await supabase
    .from("challenges")
    .select("*")
    .gte("end_date", new Date().toISOString())
    .order("participant_count", { ascending: false });
  return data ?? [];
}

export async function joinChallenge(userId: string, challengeId: string) {
  const supabase = await db();
  await supabase.from("challenge_participants").insert({
    user_id: userId,
    challenge_id: challengeId,
  }).then(() => {}).catch(() => {});
  return { joined: true };
}
