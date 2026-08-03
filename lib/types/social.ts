export type FeedPostType =
  | "product"
  | "service"
  | "reel"
  | "transformation"
  | "tutorial"
  | "booking"
  | "live_session"
  | "workout"
  | "before_after"
  | "style_drop";

export type FeedCategory =
  | "following"
  | "discover"
  | "nearby"
  | "fitness"
  | "beauty"
  | "style"
  | "live";

export type ReactionType =
  | "fire"
  | "motivating"
  | "love"
  | "inspiring"
  | "want_this"
  | "need_this";

export const REACTION_EMOJI: Record<ReactionType, string> = {
  fire: "🔥",
  motivating: "💪",
  love: "😍",
  inspiring: "✨",
  want_this: "👟",
  need_this: "💄",
};

export interface FeedPost {
  id: string;
  vendor_id: string;
  product_id?: string;
  service_id?: string;
  type: FeedPostType;
  feed_category?: FeedCategory;
  caption?: string;
  media_urls?: string[];
  thumbnail_url?: string;
  engagement_score?: number;
  hashtags?: string[];
  location?: string;
  created_at?: string;
  /** Batched on GET /api/feed — use in list view to skip per-post fetches */
  reaction_counts?: Partial<Record<ReactionType, number>>;
  reaction_count?: number;
  comment_count?: number;
  user_reaction?: ReactionType | null;
  vendors?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  products?: {
    id: string;
    name: string;
    price: number;
  };
}

export interface Reel {
  id: string;
  vendor_id: string;
  video_url: string;
  caption?: string;
  engagement_score?: number;
  products?: { id: string; name: string; price: number };
  vendors?: { id: string; name: string; avatar_url?: string };
}

export interface Service {
  id: string;
  vendor_id: string;
  title: string;
  short_description?: string;
  description?: string;
  category: string;
  cover_image?: string;
  price: number;
  duration_minutes?: number;
  is_virtual?: boolean;
  is_in_person?: boolean;
  bookings_count?: number;
  status?: string;
}

export interface Booking {
  id: string;
  user_id: string;
  vendor_id: string;
  service_id: string;
  total_amount: number;
  status: string;
  payment_status?: string;
  created_at?: string;
  services?: Service;
}

export interface LiveSession {
  id: string;
  vendor_id: string;
  title: string;
  description?: string;
  scheduled_for: string;
  is_live?: boolean;
  stream_url?: string;
  cover_url?: string;
  vendors?: { name: string; avatar_url?: string };
}

export interface CreatorProfile {
  id: string;
  vendor_id: string;
  bio?: string;
  specialty?: string[];
  verified?: boolean;
  subscriber_count?: number;
  rating?: number;
  cover_image?: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_url?: string;
  is_public?: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  image_url?: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface TrendingTopic {
  id: string;
  title: string;
  category: string;
  score: number;
  cover_url?: string;
}
