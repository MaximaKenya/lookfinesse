import { NextResponse } from "next/server";
import { getUserStreak, getChallenges, joinChallenge } from "@/lib/social/engagement";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

  const [streak, challenges, achievements] = await Promise.all([
    getUserStreak(userId),
    getChallenges(),
    supabase
      .from("achievements")
      .select("*")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false }),
  ]);

  return NextResponse.json({
    streak: streak ?? { current_streak: 0, longest_streak: 0 },
    challenges,
    achievements: achievements.data ?? [],
  });
}

export async function POST(req: Request) {
  const { user_id, challenge_id } = await req.json();
  if (!user_id || !challenge_id) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  await joinChallenge(user_id, challenge_id);
  return NextResponse.json({ joined: true });
}

