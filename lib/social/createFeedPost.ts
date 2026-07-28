import { supabase } from "@/lib/supabaseClient";
import type { FeedPostType, FeedCategory } from "@/lib/types/social";

type CreateFeedPostParams = {
  vendorId: string;
  productId?: string;
  serviceId?: string;
  type?: FeedPostType;
  feedCategory?: FeedCategory;
  caption?: string;
  mediaUrls?: string[];
  thumbnailUrl?: string;
  location?: string;
  hashtags?: string[];
};

export async function createFeedPost({
  vendorId,
  productId,
  serviceId,
  type = "product",
  feedCategory = "discover",
  caption,
  mediaUrls = [],
  thumbnailUrl,
  location,
  hashtags,
}: CreateFeedPostParams) {
  const { data, error } = await supabase
    .from("feed_posts")
    .insert({
      vendor_id: vendorId,
      product_id: productId ?? null,
      service_id: serviceId ?? null,
      type,
      feed_category: feedCategory,
      caption,
      media_urls: mediaUrls,
      thumbnail_url: thumbnailUrl,
      location,
      hashtags: hashtags ?? [],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
