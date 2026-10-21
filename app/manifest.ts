import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LookFinesse — Fashion, Beauty & Fitness Marketplace",
    short_name: "LookFinesse",
    description: "AI-powered fashion, beauty, fitness & wellness social commerce — Kenya & beyond",
    start_url: "/feed",
    display: "standalone",
    background_color: "#050A1A",
    theme_color: "#050A1A",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    categories: ["shopping", "lifestyle", "social"],
    shortcuts: [
      {
        name: "My Feed",
        short_name: "Feed",
        url: "/feed",
        description: "Personalized fashion & beauty feed",
      },
      {
        name: "Shop",
        short_name: "Shop",
        url: "/shop",
        description: "Browse products",
      },
      {
        name: "Reels",
        short_name: "Reels",
        url: "/reels",
        description: "Short-form video content",
      },
    ],
  };
}
