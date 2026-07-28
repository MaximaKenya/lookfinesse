import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LookFinesse — Fashion, Beauty & Fitness Marketplace",
    short_name: "LookFinesse",
    description: "AI-powered fashion, beauty, fitness & wellness social commerce — Kenya & beyond",
    start_url: "/feed",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#0A0A0A",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/logo-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/logo-icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
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
