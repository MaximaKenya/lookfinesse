import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, ShoppingBag, Calendar } from "lucide-react";
import { getReelById } from "@/lib/social/queries";
import FollowButton from "@/components/social/FollowButton";
import AddToCartButton from "@/components/AddToCartButton";
import { ReelDetailVideo, ReelDetailComments } from "@/components/reels/ReelDetailEngagement";

export default async function ReelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reel = await getReelById(id);
  if (!reel) return notFound();

  const vendorName = reel.vendors?.name || reel.vendors?.business_name || "Creator";
  const vendorId = reel.vendor_id || reel.vendors?.id;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-6 md:py-6 space-y-5">
      <Link href="/reels" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm">
        <ArrowLeft className="w-4 h-4" /> Reels
      </Link>

      <ReelDetailVideo reel={reel} />

      {reel.vendors && (
        <div className="flex items-center justify-between">
          <Link href={`/creator/${vendorId}`} className="flex items-center gap-3 group">
            <img
              src={
                reel.vendors.avatar_url ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(vendorName)}`
              }
              alt=""
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <div className="font-bold text-white flex items-center gap-1">
                {vendorName}
                {reel.vendors.verified && <BadgeCheck className="w-4 h-4 text-blue-400" />}
              </div>
            </div>
          </Link>
          {vendorId && <FollowButton vendorId={vendorId} />}
        </div>
      )}

      {reel.caption && <p className="text-white text-base leading-relaxed">{reel.caption}</p>}

      {reel.products && (
        <div className="bg-gradient-to-br from-purple-900/15 to-pink-900/10 border border-white/8 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-4">
            {reel.products.image_url && (
              <img
                src={reel.products.image_url}
                alt=""
                className="w-20 h-20 rounded-2xl object-cover border border-white/10"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Featured Product</p>
              <h3 className="font-bold text-white">{reel.products.name}</h3>
              <p className="text-white/80 mt-0.5">KES {reel.products.price?.toLocaleString()}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <AddToCartButton product={reel.products} />
            <Link
              href={`/checkout?product=${reel.products.id}`}
              className="flex items-center justify-center gap-1.5 bg-white text-black py-2.5 rounded-xl font-semibold text-sm hover:bg-white/90"
            >
              <ShoppingBag className="w-4 h-4" /> Checkout
            </Link>
          </div>
          <Link href={`/product/${reel.products.id}`} className="block text-center text-xs text-white/50 hover:text-white">
            View product →
          </Link>
        </div>
      )}

      {reel.services && (
        <div className="bg-gradient-to-br from-blue-900/15 to-purple-900/10 border border-white/8 rounded-3xl p-5 space-y-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Bookable Service</p>
            <h3 className="font-bold text-white">{reel.services.title}</h3>
            <p className="text-white/80 mt-0.5">KES {reel.services.price?.toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/services/${reel.services.id}/book`}
              className="flex items-center justify-center gap-1.5 bg-white text-black py-2.5 rounded-xl font-semibold text-sm hover:bg-white/90"
            >
              <Calendar className="w-4 h-4" /> Book now
            </Link>
            <Link
              href={`/services/${reel.services.id}`}
              className="flex items-center justify-center gap-1.5 bg-white/10 border border-white/10 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-white/15"
            >
              View service
            </Link>
          </div>
        </div>
      )}

      <ReelDetailComments reelId={reel.id} />
    </div>
  );
}
