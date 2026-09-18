"use client";

import { Shirt } from "lucide-react";
import AssistantChat from "@/components/ai/AssistantChat";

export default function StylistPage() {
  return (
    <AssistantChat
      assistantType="stylist"
      title="AI Stylist"
      subtitle="Outfits for Nairobi weather, occasions & your closet"
      icon={Shirt}
      accent="purple"
      starters={[
        "What should I wear today in Nairobi?",
        "Outfit for a rooftop dinner in Westlands",
        "Casual streetwear for weekend vibes",
        "Office look that still feels stylish",
        "Show stylists near me",
      ]}
      emptyTitle="Your personal stylist is ready"
      emptyHint="Ask about outfits, colours, occasions — or what's near you"
    />
  );
}
