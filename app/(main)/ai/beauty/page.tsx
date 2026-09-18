"use client";

import { Flower2 } from "lucide-react";
import AssistantChat from "@/components/ai/AssistantChat";

export default function BeautyAIPage() {
  return (
    <AssistantChat
      assistantType="beauty"
      title="AI Beauty"
      subtitle="Skincare & hair for melanin-rich skin in Nairobi"
      icon={Flower2}
      accent="pink"
      starters={[
        "Skincare routine for oily skin",
        "Glass skin morning routine",
        "Best products for hyperpigmentation",
        "Book a facial near me",
        "Gentle routine for sensitive skin",
      ]}
      emptyTitle="Your beauty advisor is ready"
      emptyHint="Routines, SPF, hair — plus nearby salons when you ask"
    />
  );
}
