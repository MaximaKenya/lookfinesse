import Link from "next/link";
import { ArrowLeft, ShoppingBag, BadgeCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { getFeedPostById } from "@/lib/social/queries";
import FeedPostComments from "@/components/feed/FeedPostComments";
import FollowButton from "@/components/social/FollowButton";
import AddToCartButton from "@/components/AddToCartButton";

export default async function FeedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getFeedPostById(id);
  if (!post) return notFound();

  const thumb = post.thumbnail_url || (Array.isArray(post.media_urls) ? post.media_urls[0] : null);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <Link href="/feed" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Feed
      </Link>

      {/* Creator */}
      {post.vendors && (
        <div className="flex items-center justify-between">
          <Link href={`/creator/${post.vendor_id || post.vendors.id}`} className="flex items-center gap-3 group">
            <img
              src={post.vendors.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${post.vendors.name}`}
              alt=""
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-purple-500/40 transition-all"
            />
            <div>
              <div className="font-bold text-white flex items-center gap-1">
                {post.vendors.name || "Creator"}
                {post.vendors.verified && <BadgeCheck className="w-4 h-4 text-blue-400" />}
              </div>
              {post.created_at && (
                <div className="text-xs text-white/40">{new Date(post.created_at).toLocaleString()}</div>
              )}
            </div>
          </Link>
          {post.vendor_id && <FollowButton vendorId={post.vendor_id} />}
        </div>
      )}

      {/* Media */}
      {thumb && (
        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-[#0f0f0f] border border-white/8">
          <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      )}
      {post.video_url && (
        <video src={post.video_url} controls className="w-full rounded-3xl bg-black" />
      )}

      {/* Engagement */}
      <FeedPostComments postId={post.id} />

      {/* Caption + description */}
      {post.caption && (
        <p className="text-white text-base leading-relaxed">{post.caption}</p>
      )}
      {Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.hashtags.map((h: string) => (
            <span key={h} className="text-xs bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full">
              {h.startsWith("#") ? h : `#${h}`}
            </span>
          ))}
        </div>
      )}

      {/* Product embed */}
      {post.products && (
        <div className="bg-gradient-to-br from-purple-900/15 to-pink-900/10 border border-white/8 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-4">
            {post.products.image_url && (
              <img src={post.products.image_url} alt="" className="w-20 h-20 rounded-2xl object-cover border border-white/10" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Featured Product</p>
              <h3 className="font-bold text-white">{post.products.name}</h3>
              <p className="text-white/80 mt-0.5">KES {post.products.price?.toLocaleString()}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <AddToCartButton product={post.products} />
            <Link
              href={`/checkout?product=${post.products.id}`}
              className="flex items-center justify-center gap-1.5 bg-white text-black py-2.5 rounded-xl font-semibold text-sm hover:bg-white/90"
            >
              <ShoppingBag className="w-4 h-4" /> Checkout
            </Link>
          </div>
          <Link href={`/product/${post.products.id}`} className="block text-center text-xs text-white/50 hover:text-white">
            View product →
          </Link>
        </div>
      )}
    </div>
  );
}
