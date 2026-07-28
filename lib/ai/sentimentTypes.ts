export type SentimentSourceType = "feed_post" | "comment" | "review" | "booking_note";
export type SentimentLabel = "positive" | "neutral" | "negative";

export function sourceHref(sourceType: SentimentSourceType, sourceId: string): string {
  switch (sourceType) {
    case "feed_post":
      return `/feed/${sourceId}`;
    case "comment":
      return `/feed?highlight=${sourceId}`;
    case "review":
      return `/product/${sourceId}#reviews`;
    case "booking_note":
      return `/bookings?note=${sourceId}`;
    default:
      return "/feed";
  }
}
