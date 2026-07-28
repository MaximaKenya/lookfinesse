// Deterministic, weather-aware tips with real product/vendor links.
// Varies copy by user preferences hash — never identical for every user.
// Used when OPENAI_API_KEY is unset OR as guaranteed fallback if the model errors.

import type { UserPreferences } from "@/lib/auth/onboarding";

export interface WeatherInput {
  city: string;
  temperatureC: number;
  description: string;
  humidity: number;
  windKph: number;
  weatherCode: number;
  isDay: boolean;
}

export interface TodayTip {
  category: "outfit" | "skincare" | "fitness";
  title: string;
  body: string;
  productHref: string;
  productLabel: string;
  serviceHref: string;
  serviceLabel: string;
}

function isRainy(code: number) {
  return code >= 51 && code <= 99;
}
function isHot(t: number) {
  return t >= 27;
}
function isCool(t: number) {
  return t <= 16;
}

function seedFromPrefs(p: UserPreferences): number {
  const s = [
    p.gender ?? "",
    p.age_group ?? "",
    p.style ?? "",
    ...(p.interests ?? []).sort(),
  ].join("|");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number, offset: number): T {
  return arr[(seed + offset) % arr.length];
}

function shopHref(p: UserPreferences, category: "fashion" | "beauty" | "fitness"): string {
  const interests = (p.interests ?? []).join(",").toLowerCase();
  if (interests) return `/shop?category=${category}&q=${encodeURIComponent(interests.split(",")[0] ?? category)}`;
  return `/shop?category=${category}`;
}

function genderTone(p: UserPreferences): "feminine" | "masculine" | "neutral" {
  const g = (p.gender ?? "").toLowerCase();
  if (g.includes("female") || g.includes("woman")) return "feminine";
  if (g.includes("male") || g.includes("man")) return "masculine";
  return "neutral";
}

export function generateTodayTips(w: WeatherInput, prefs: UserPreferences = {}): TodayTip[] {
  const rainy = isRainy(w.weatherCode);
  const hot = isHot(w.temperatureC);
  const cool = isCool(w.temperatureC);
  const humid = w.humidity > 70;
  const seed = seedFromPrefs(prefs);
  const tone = genderTone(prefs);
  const style = (prefs.style ?? "modern").toLowerCase();
  const age = prefs.age_group ?? "adult";

  const outfitVariants: Omit<TodayTip, "category">[] = [];

  if (rainy) {
    outfitVariants.push(
      {
        title: `Rain-ready in ${w.city}`,
        body: `${w.temperatureC}°C, ${w.description.toLowerCase()}. Water-resistant trench, sleek boots, and a crossbody that keeps essentials dry.`,
        productHref: shopHref(prefs, "fashion"),
        productLabel: "Shop rain layers",
        serviceHref: "/services?category=style",
        serviceLabel: "Book a stylist",
      },
      {
        title: "Wet-weather polish",
        body: `Layer a lightweight Anorak over a moisture-wicking base. ${tone === "feminine" ? "Midi skirt + tall boots" : tone === "masculine" ? "Tapered chinos + Chelsea boots" : "Relaxed trousers + waterproof sneakers"} for ${age} style.`,
        productHref: shopHref(prefs, "fashion"),
        productLabel: "Shop wet-day edits",
        serviceHref: "/services?category=style",
        serviceLabel: "Style session",
      }
    );
  } else if (hot) {
    outfitVariants.push(
      {
        title: `${w.temperatureC}°C — stay breathable`,
        body: hot
          ? `Linen sets, open-weave fabrics, and UV-aware layers. ${style === "minimal" ? "Monochrome linen co-ord" : "Ankara wrap skirt + airy tank"} beat the heat.`
          : `Light layers for ${w.description.toLowerCase()}.`,
        productHref: shopHref(prefs, "fashion"),
        productLabel: "Shop linen & light layers",
        serviceHref: "/services?category=style",
        serviceLabel: "Book a stylist",
      },
      {
        title: "Heat-wave edit",
        body: `${tone === "masculine" ? "Relaxed camp-collar shirt + tailored shorts" : tone === "feminine" ? "Bias-cut slip dress + flat sandals" : "Wide-leg linen + breathable tee"} — SPF non-negotiable at ${w.temperatureC}°C.`,
        productHref: shopHref(prefs, "fashion"),
        productLabel: "Shop summer picks",
        serviceHref: "/services?category=style",
        serviceLabel: "Capsule consult",
      }
    );
  } else if (cool) {
    outfitVariants.push(
      {
        title: `Cool ${w.city} layering`,
        body: `${w.temperatureC}°C — structured blazer over a fine-gauge knit, ${tone === "masculine" ? "wool trousers" : "high-rise denim"}, and a statement scarf.`,
        productHref: shopHref(prefs, "fashion"),
        productLabel: "Shop blazers & knits",
        serviceHref: "/services?category=style",
        serviceLabel: "Book a stylist",
      },
      {
        title: "Crisp-air uniform",
        body: `Try a ${style.includes("street") ? "oversized puffer + cargo" : "Kitenge-lined coat + slim bootcut"} for ${age} ${tone} dressing without bulk.`,
        productHref: shopHref(prefs, "fashion"),
        productLabel: "Shop cool-weather",
        serviceHref: "/services?category=style",
        serviceLabel: "Style refresh",
      }
    );
  } else {
    outfitVariants.push(
      {
        title: `Goldilocks ${w.temperatureC}°C`,
        body: `${w.description}. ${tone === "feminine" ? "Silk blouse + tailored wide-leg" : tone === "masculine" ? "Oxford + chino + loafer" : "Elevated casual co-ord"} — perfect for ${style} taste.`,
        productHref: shopHref(prefs, "fashion"),
        productLabel: "Shop today’s edit",
        serviceHref: "/services?category=style",
        serviceLabel: "Book a stylist",
      },
      {
        title: "Effortless mid-temp look",
        body: `Layer a light overshirt over a rib tank; add gold accents if your vibe is ${style}. Nairobi altitude means SPF even when cloudy.`,
        productHref: shopHref(prefs, "fashion"),
        productLabel: "Shop transitional",
        serviceHref: "/services?category=style",
        serviceLabel: "Styling call",
      }
    );
  }

  const skincareVariants: Omit<TodayTip, "category">[] = humid
    ? [
        {
          title: "Humidity control protocol",
          body: `${w.humidity}% humidity — gel cleanser, niacinamide, oil-free gel-cream. ${tone === "masculine" ? "Lightweight aftershave balm" : "Blotting mist over heavy powder"}.`,
          productHref: shopHref(prefs, "beauty"),
          productLabel: "Shop oil-control",
          serviceHref: "/services?category=beauty",
          serviceLabel: "Book a facial",
        },
        {
          title: "Shine-free barrier",
          body: `Double-cleanse PM; AM: antioxidant serum + mattifying SPF 50. Great for ${age} skin in ${w.city}.`,
          productHref: shopHref(prefs, "beauty"),
          productLabel: "Shop serums",
          serviceHref: "/services?category=beauty",
          serviceLabel: "Deep cleanse",
        },
      ]
    : hot
    ? [
        {
          title: "High-UV defense",
          body: `${w.temperatureC}°C + altitude — vitamin C AM, SPF 50 reapplied, hyaluronic PM. ${prefs.interests?.includes("fitness") ? "Post-workout cooling gel helps." : ""}`,
          productHref: shopHref(prefs, "beauty"),
          productLabel: "Shop SPF & brightening",
          serviceHref: "/services?category=beauty",
          serviceLabel: "Book a facial",
        },
        {
          title: "Sunny-day glow",
          body: `Lightweight tinted SPF + lip balm with SPF. Avoid heavy occlusives until evening.`,
          productHref: shopHref(prefs, "beauty"),
          productLabel: "Shop sun care",
          serviceHref: "/services?category=beauty",
          serviceLabel: "Skin consult",
        },
      ]
    : [
        {
          title: "Hydration + repair",
          body: `${w.temperatureC}°C, ${w.humidity}% humidity — ceramide cream, gentle milk cleanser, nightly retinol if ${age !== "teen"}.`,
          productHref: shopHref(prefs, "beauty"),
          productLabel: "Shop moisturisers",
          serviceHref: "/services?category=beauty",
          serviceLabel: "Book a facial",
        },
        {
          title: "Barrier-first routine",
          body: `Centella or panthenol serum under moisturiser. Still wear SPF — UV penetrates cloud cover in ${w.city}.`,
          productHref: shopHref(prefs, "beauty"),
          productLabel: "Shop barrier care",
          serviceHref: "/services?category=beauty",
          serviceLabel: "Glow facial",
        },
      ];

  const fitnessVariants: Omit<TodayTip, "category">[] = rainy
    ? [
        {
          title: "Indoor power session",
          body: "25-min EMOM: bands, core, yoga flow. Skip slick pavements — mobility work counts.",
          productHref: shopHref(prefs, "fitness"),
          productLabel: "Shop home gear",
          serviceHref: "/services?category=fitness",
          serviceLabel: "Online trainer",
        },
        {
          title: "Rain-day reset",
          body: `${tone === "feminine" ? "Pilates + stretch" : "Bodyweight strength circuit"} at home. Focus on form, not volume.`,
          productHref: shopHref(prefs, "fitness"),
          productLabel: "Shop mats & bands",
          serviceHref: "/services?category=fitness",
          serviceLabel: "Book yoga",
        },
      ]
    : hot
    ? [
        {
          title: "Train smart in heat",
          body: `${w.temperatureC}°C — session before 9am or after 6pm. Electrolytes + shaded route or AC gym.`,
          productHref: shopHref(prefs, "fitness"),
          productLabel: "Shop hydration",
          serviceHref: "/services?category=fitness",
          serviceLabel: "Book a trainer",
        },
        {
          title: "Heat-aware cardio",
          body: prefs.interests?.some((i) => i.toLowerCase().includes("fit"))
            ? "Swap long runs for pool laps or incline walk — keep HR in zone 2."
            : "20-min walk + mobility — consistency beats intensity today.",
          productHref: shopHref(prefs, "fitness"),
          productLabel: "Shop fitness gear",
          serviceHref: "/services?category=fitness",
          serviceLabel: "HIIT booking",
        },
      ]
    : [
        {
          title: "Prime outdoor window",
          body: `${w.temperatureC}°C in ${w.city} — ideal for ${prefs.interests?.includes("fitness") ? "tempo run or bootcamp" : "brisk walk + light strength"}.`,
          productHref: shopHref(prefs, "fitness"),
          productLabel: "Shop activewear",
          serviceHref: "/services?category=fitness",
          serviceLabel: "Book a session",
        },
        {
          title: "Move with the weather",
          body: `Karura trail or studio strength — dress in layers you can shed. Post-workout protein within 45 min.`,
          productHref: shopHref(prefs, "fitness"),
          productLabel: "Shop recovery",
          serviceHref: "/services?category=fitness",
          serviceLabel: "Trainer match",
        },
      ];

  const outfit = pick(outfitVariants, seed, 0);
  const skincare = pick(skincareVariants, seed, 7);
  const fitness = pick(fitnessVariants, seed, 13);

  return [
    { category: "outfit", ...outfit },
    { category: "skincare", ...skincare },
    { category: "fitness", ...fitness },
  ];
}

export function shopRedirectFor(tipCategory: TodayTip["category"]): string {
  if (tipCategory === "outfit") return "/shop?category=fashion";
  if (tipCategory === "skincare") return "/shop?category=beauty";
  return "/shop?category=fitness";
}
