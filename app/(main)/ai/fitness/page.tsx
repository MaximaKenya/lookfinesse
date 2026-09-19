"use client";

import { Dumbbell } from "lucide-react";
import AssistantChat from "@/components/ai/AssistantChat";

export default function FitnessAIPage() {
  return (
    <AssistantChat
      assistantType="fitness"
      title="Gym Buddy"
      subtitle="Workouts, trainers & recovery — Nairobi-aware"
      icon={Dumbbell}
      accent="cyan"
      starters={[
        "Beginner home workout without equipment",
        "Find a trainer near me",
        "30-day muscle building plan",
        "Fat loss routine for a busy week",
        "What should I eat after training in Nairobi?",
      ]}
      emptyTitle="Gym Buddy is in your corner"
      emptyHint="Ask for a plan, a nearby gym, or a recovery protocol"
    />
  );
}
