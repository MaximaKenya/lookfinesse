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
    challenges: challenges.length ? challenges : getDefaultChallenges(),
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

function getDefaultChallenges() {
  return [
    {
      id: "c1",
      title: "7-Day Glow Up",
      description: "Complete a beauty routine daily for 7 days",
      category: "beauty",
      participant_count: 1240,
    },
    {
      id: "c2",
      title: "30-Day Shred",
      description: "Work out 4x per week for 30 days",
      category: "fitness",
      participant_count: 3890,
    },
    {
      id: "c3",
      title: "Style Week",
      description: "Post or save 5 outfit inspirations",
      category: "style",
      participant_count: 890,
    },
  ];
}
