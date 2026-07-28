type Params = {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
};

export function computeEngagementScore({
  likes,
  comments,
  shares,
  saves,
  views,
}: Params) {
  return (
    likes * 2 +
    comments * 3 +
    shares * 5 +
    saves * 4 +
    views * 0.05
  );
}