import { dedupeReels, getReels } from "@/lib/social/queries";
import ReelCard from "@/components/reels/ReelCard";

export default async function ReelsPage() {
  const reels = dedupeReels(await getReels());

  return (
    <div className="reels-page">
      <div className="reels-shell">
        <div className="reels-scroll scrollbar-hide">
          {reels.length === 0 ? (
            <div className="reel-slide">
              <div className="flex flex-col items-center justify-center gap-4 px-6 h-full">
                <div className="text-5xl">🎬</div>
                <p className="text-white/40 font-medium">No reels yet</p>
                <p className="text-sm text-white/25 text-center">Check back soon</p>
              </div>
            </div>
          ) : (
            reels.map((reel) => <ReelCard key={reel.id} reel={reel} />)
          )}
        </div>
      </div>
    </div>
  );
}
