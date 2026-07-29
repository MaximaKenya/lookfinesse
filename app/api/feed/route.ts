import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import {
  guardSupabaseEnv,
  isNetworkError,
  supabaseUnreachableResponse,
} from "@/lib/api/supabaseRoute";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { createFeedPost } from "@/lib/social/createFeedPost";
import type { FeedCategory, FeedPostType } from "@/lib/types/social";
import {
  countVendorPostsThisMonth,
  getVendorSubscriptionState,
} from "@/lib/subscriptions/vendorSubscription";
import { tierMeetsMinimum } from "@/lib/subscriptions/platformEntitlements";
import { canViewExclusivePost, getUserFanTierForVendor } from "@/lib/subscriptions/fanAccess";
import { queueSentimentAnalysis } from "@/lib/ai/sentimentAnalysis";
import { isPlatformAdmin } from "@/lib/auth/platformAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") ?? "discover") as FeedCategory;
  const userId = searchParams.get("user_id") ?? undefined;

  try {
    const envGuard = guardSupabaseEnv();
    if (envGuard) {
      const { getFeedPosts } = await import("@/lib/social/queries");
      const posts = await getFeedPosts({ type, userId });
      return NextResponse.json(posts, {
        headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
      });
    }

    const { getFeedPosts } = await import("@/lib/social/queries");
    const posts = await getFeedPosts({ type, userId });

    const server = await createSupabaseServer();
    const filtered = [];
    for (const post of posts) {
      const required = (post as { required_fan_tier?: string | null }).required_fan_tier;
      if (!required) {
        filtered.push(post);
        continue;
      }
      const vendorId = (post as { vendor_id?: string }).vendor_id;
      if (!vendorId) {
        filtered.push(post);
        continue;
      }
      const fanTier = await getUserFanTierForVendor(server, userId, vendorId);
      if (canViewExclusivePost(fanTier, required, false)) filtered.push(post);
    }

    return NextResponse.json(filtered, {
      headers: {
        "Cache-Control": userId ? "private, max-age=15" : "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    if (isNetworkError(err)) {
      try {
        const { getFeedPosts } = await import("@/lib/social/queries");
        const posts = await getFeedPosts({ type, userId });
        return NextResponse.json(posts, {
          headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
        });
      } catch {
        return supabaseUnreachableResponse(err instanceof Error ? err.message : undefined);
      }
    }
    console.error("[feed GET]", err);
    return NextResponse.json({ error: "Failed to load feed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      vendor_id,
      type = "product",
      feed_category = "discover",
      caption,
      hashtags,
      media_urls,
      thumbnail_url,
      video_url,
      audio_url,
      product_id,
      product_ids,
      service_id,
      service_ids,
      location,
      promote_as_ad,
    } = body;

    if (!vendor_id) {
      return NextResponse.json({ error: "vendor_id is required" }, { status: 400 });
    }

    const server = await createSupabaseServer();
    const {
      data: { user: authUser },
    } = await server.auth.getUser();
    let feedIsAdmin = false;
    if (authUser) {
      const { data: roleRows } = await server
        .from("user_roles")
        .select("role")
        .eq("user_id", authUser.id);
      feedIsAdmin = isPlatformAdmin({
        email: authUser.email,
        roles: (roleRows ?? []).map((r) => r.role),
        appMetadata: (authUser.app_metadata ?? null) as Record<string, unknown> | null,
      });
    }

    const sub = await getVendorSubscriptionState(server, vendor_id);

    if (!feedIsAdmin && sub.entitlements.monthlyPostLimit != null) {
      const count = await countVendorPostsThisMonth(server, vendor_id);
      if (count >= sub.entitlements.monthlyPostLimit) {
        return NextResponse.json(
          {
            error: `Starter plan limit: ${sub.entitlements.monthlyPostLimit} posts per month. Upgrade to Pro for unlimited posts.`,
          },
          { status: 403 }
        );
      }
    }

    if (
      !feedIsAdmin &&
      promote_as_ad &&
      (!sub.active || !tierMeetsMinimum(sub.tier, "pro"))
    ) {
      return NextResponse.json(
        { error: "Ads require an active Pro or Elite plan" },
        { status: 403 }
      );
    }

    const primaryProductId = product_id ?? product_ids?.[0] ?? null;
    const primaryServiceId = service_id ?? service_ids?.[0] ?? null;

    const mediaItems: string[] = Array.isArray(media_urls)
      ? media_urls.filter(Boolean)
      : thumbnail_url
        ? [thumbnail_url]
        : [];

    if (mediaItems.length === 0 && !caption?.trim()) {
      return NextResponse.json({ error: "Add media or a caption" }, { status: 400 });
    }

    const post = await createFeedPost({
      vendorId: vendor_id,
      productId: primaryProductId ?? undefined,
      serviceId: primaryServiceId ?? undefined,
      type: type as FeedPostType,
      feedCategory: feed_category as FeedCategory,
      caption: caption?.trim(),
      mediaUrls: mediaItems,
      thumbnailUrl: thumbnail_url ?? mediaItems[0],
      location,
      hashtags: Array.isArray(hashtags)
        ? hashtags
        : typeof hashtags === "string"
          ? hashtags.split(/[,#\s]+/).filter(Boolean)
          : [],
    });

    const extra: Record<string, unknown> = {};
    if (video_url) extra.video_url = video_url;
    if (audio_url) extra.audio_url = audio_url;

    if (Object.keys(extra).length > 0 && post?.id) {
      await supabase.from("feed_posts").update(extra).eq("id", post.id);
    }

    let campaign = null;
    if (promote_as_ad && post?.id) {
      const adSpend = Number(body.ad_credit_amount ?? 500);
      if (!feedIsAdmin && adSpend > sub.adCreditsRemaining) {
        return NextResponse.json(
          {
            error: `Insufficient ad credits (KES ${sub.adCreditsRemaining} remaining). Starter: KES ${sub.entitlements.adCreditsMonthly}/mo cap.`,
          },
          { status: 403 }
        );
      }

      if (!feedIsAdmin) {
        await server
          .from("platform_subscriptions")
          .update({
            ad_credits_remaining: Math.max(0, sub.adCreditsRemaining - adSpend),
            updated_at: new Date().toISOString(),
          })
          .eq("vendor_id", vendor_id);
      }

      const imageUrl = thumbnail_url ?? mediaItems[0] ?? "";
      const ctaUrl = primaryProductId
        ? `/product/${primaryProductId}`
        : primaryServiceId
          ? `/services/${primaryServiceId}`
          : `/feed`;

      const { data: ad } = await supabase
        .from("ad_campaigns")
        .insert({
          vendor_id,
          post_id: post.id,
          product_id: primaryProductId,
          service_id: primaryServiceId,
          title: caption?.slice(0, 60) || "Promoted post",
          headline: caption?.slice(0, 80) || "Shop now",
          image_url: imageUrl || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
          cta_url: ctaUrl,
          target_categories: [feed_category].filter((c) => c !== "discover"),
          daily_budget: adSpend,
          bid_amount: 15,
          start_at: new Date().toISOString(),
          end_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
          status: "pending",
        })
        .select()
        .single();
      campaign = ad;
    }

    const textForSentiment = [caption?.trim(), ...(Array.isArray(hashtags) ? hashtags : [])]
      .filter(Boolean)
      .join(" ");
    if (post?.id && textForSentiment) {
      queueSentimentAnalysis({
        sourceType: "feed_post",
        sourceId: post.id,
        userId: vendor_id,
        text: textForSentiment,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, post, campaign }, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create post" },
      { status: 500 }
    );
  }
}
