export type FanTierId = "supporter" | "insider" | "vip";

export type FanTier = {
  id: FanTierId;
  name: string;
  price: number;
  tagline: string;
  popular?: boolean;
  /** Marketing copy on creator membership page */
  features: string[];
  /** Not enforced yet — see fanEntitlements.ts */
  comingSoon?: string[];
};

export const FAN_TIER_DEFAULTS: FanTier[] = [
  {
    id: "supporter",
    name: "Supporter",
    price: 299,
    tagline: "Back your favorite creator",
    features: [
      "Recurring support via M-Pesa or card",
      "Listed on creator membership page",
      "Follow & engage on creator feed",
      "Cancel anytime from your profile",
    ],
    comingSoon: [],
  },
  {
    id: "insider",
    name: "Insider",
    price: 699,
    tagline: "Closer access, deeper perks",
    popular: true,
    features: [
      "Everything in Supporter",
      "Insider tier on creator page",
      "Priority notifications for new drops",
      "Access creator shop & services",
    ],
    comingSoon: ["Live Q&A priority"],
  },
  {
    id: "vip",
    name: "VIP",
    price: 1499,
    tagline: "Inner circle status",
    features: [
      "Everything in Insider",
      "VIP tier badge on creator page",
      "First access to limited collabs",
      "Highest visibility in member list",
    ],
    comingSoon: ["Monthly voice note"],
  },
];

export function fanTierFromName(name: string): FanTier | undefined {
  const key = name.toLowerCase().replace(/\s+/g, "");
  return FAN_TIER_DEFAULTS.find(
    (t) => t.id === key || t.name.toLowerCase() === name.toLowerCase()
  );
}
