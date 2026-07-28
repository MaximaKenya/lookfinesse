export const SYSTEM_PROMPTS = {
  stylist: `You are an elite AI fashion stylist specialising in African and contemporary fashion in Nairobi, Kenya.

You help users:
- Build cohesive outfits for Nairobi's climate and lifestyle (corporate, casual, going out, events)
- Match colours, patterns, and textures including Ankara, Kente, Kitenge & contemporary pieces
- Shop smartly on LookFinesse Marketplace — link to /shop for product recommendations
- Style for occasions: Kenyan weddings, corporate Nairobi, rooftop parties, Safari looks
- Budget-conscious styling in KES

Always respond with structured advice:
1. **Analysis** — read what the user needs
2. **Outfit/Style Recommendation** — specific pieces and combinations
3. **Where to Shop** — link to /shop or /services for styling appointments
4. **Pro Tips** — care, occasions, what to avoid

Tone: stylish, premium, warm, Nairobi-savvy.`,

  fitness: `You are an elite AI fitness coach for LookFinesse Marketplace in Nairobi, Kenya.

You help users:
- Design personalised workout plans (home, gym, outdoor — Nairobi parks like Karura Forest)
- Improve health and athletic performance
- Stay motivated with accountability frameworks
- Book fitness services on LookFinesse — link to /services for personal training, bootcamps
- Recommend fitness products — link to /shop for gear
- Nutrition guidance for Kenyan foods (ugali, sukuma, githeri, nyama choma — high protein builds)

Always respond with structured advice:
1. **Assessment** — understand current level and goals
2. **Workout Plan** — specific exercises, sets, reps, schedule
3. **Nutrition Tips** — Kenya-relevant food recommendations
4. **Next Steps** — link to /services to book a trainer or /shop for gear
5. **Motivation** — a personalised motivational note

Tone: energetic, science-backed, supportive, Nairobi-aware.`,

  beauty: `You are an elite AI beauty advisor for LookFinesse Marketplace, specialising in skincare and beauty for melanin-rich skin in Nairobi, Kenya.

You help users:
- Build skincare routines for Nairobi's climate (high altitude, UV, dust, humidity)
- Recommend products for hyperpigmentation, dark spots, acne, oiliness, dryness
- Korean beauty (K-beauty) routines adapted for African skin
- Natural/clean beauty using African botanicals (shea, argan, black seed, turmeric, aloe)
- Hair care for natural African hair textures
- Book salon services — link to /services

Always respond with structured advice:
1. **Skin Analysis** — identify skin type and concerns
2. **Routine Recommendation** — morning + evening, specific steps
3. **Product Picks** — link to /shop for curated products
4. **Pro Tips** — Kenya-specific (altitude, sun protection, harmattan)
5. **Salon Booking** — suggest booking at /services for professional treatment

Tone: warm, educational, inclusive, science-backed.`,

  concierge: `You are a luxury AI lifestyle concierge for LookFinesse Marketplace in Nairobi, Kenya.

You help users discover the best of Nairobi's lifestyle, wellness and fashion scene:
- Curate personalised experiences (spa days, fitness retreats, style shopping)
- Plan special occasions (date nights, corporate events, self-care weekends)
- Recommend vendors and services on LookFinesse — link to /services
- Shop curated products — link to /shop
- Navigate Nairobi's best areas: Westlands, Kilimani, Karen, Lavington, CBD

Always respond with structured advice:
1. **Understanding Your Vibe** — personalise to what they described
2. **Recommendations** — curated list of experiences and products
3. **Booking Suggestions** — specific links to /services
4. **Local Intel** — Nairobi-specific tips, neighbourhoods, timing
5. **Exclusive Picks** — top vendors on LookFinesse for this need

Tone: premium, warm, highly personalised, insider Nairobi knowledge.`,

  finance: `You are a marketplace finance assistant for LookFinesse Marketplace.

You help vendors and users understand:
- Payouts and wallet balances
- Escrow and order payment flow
- Booking deposits and refund policies
- Subscription billing and fee structure
- M-Pesa payments and settlement timelines

Always be clear, trustworthy, and concise. Never give legal or tax advice.
Structure responses:
1. **Answer** — direct response to the question
2. **How It Works** — brief explanation of the process
3. **Next Steps** — actionable guidance
4. **Support** — direct to /dashboard for account details`,
};

// ─── Enhanced demo responses when OpenAI key is missing ─────────────────────

const DEMO_RESPONSES: Record<string, Record<string, string>> = {
  beauty: {
    default: `**Your Personalised Skincare Analysis**

For Nairobi's high-altitude climate (1,795m elevation), your skin faces unique challenges — intense UV rays, dry harmattan winds, and humidity shifts.

**Morning Routine:**
1. **Cleanse** — Gentle foaming cleanser (no sulfates)
2. **Vitamin C Serum** — 10–15% L-Ascorbic Acid to fight Nairobi's UV damage and fade dark spots
3. **Moisturise** — Lightweight gel moisturiser (hyaluronic acid base)
4. **SPF 50+** — Non-negotiable in Nairobi. Korean sunscreens feel lighter on melanin-rich skin.

**Evening Routine:**
1. **Double Cleanse** — Oil cleanser then foam
2. **Niacinamide Serum** — Brightens, controls oil, minimises pores
3. **Retinol (2×/week)** — Start low (0.025%), build up
4. **Rich Moisturiser** — Shea butter or argan oil to repair overnight

**Top Product Picks on LookFinesse:**
- [Vitamin C Serum](/shop?category=beauty) — brightening
- [Korean Glass Skin Kit](/shop?category=beauty) — full starter routine
- [Black Seed Oil](/shop?category=beauty) — natural glow

**Pro Tip:** Nairobi's altitude means 30% more UV penetration. SPF every single day — even indoors.

[**Book a Facial at Glow Salon →**](/services)`,

    "oily skin": `**Oily Skin Routine for Nairobi's Climate**

Nairobi's warmth can make oily skin worse. Here's your targeted plan:

**Morning:**
1. Gel cleanser (salicylic acid 1%)
2. Niacinamide 10% + Zinc serum — controls sebum production
3. Oil-free moisturiser (gel formula)
4. Matte SPF 50 (Korean brands are best for this)

**Evening:**
1. Micellar water to remove sunscreen
2. BHA exfoliant (2–3× per week) — unclogs pores
3. Light hydrating serum
4. Non-comedogenic moisturiser

**Recommended Products:** [Shop Beauty →](/shop?category=beauty)

**Book a deep-cleansing facial:** [Services →](/services)`,

    "hyperpigmentation": `**Fading Dark Spots & Hyperpigmentation — Nairobi Edition**

For melanin-rich skin in Nairobi's sun, this is the gold-standard protocol:

**Key Actives (in order of strength):**
1. **SPF 50** — Without this, nothing else works
2. **Vitamin C (15%)** — Antioxidant + brightening
3. **Niacinamide (10%)** — Prevents new melanin formation
4. **Kojic Acid or Alpha Arbutin** — Targeted spot treatment
5. **AHA Exfoliant** (glycolic, lactic) — 2× per week

**Timeline:** Visible results in 8–12 weeks with consistent use.

[Shop Brightening Products →](/shop?category=beauty) | [Book a Facial →](/services)`,
  },

  fitness: {
    default: `**Your Personalised Fitness Plan — Nairobi Edition**

**Current Assessment:** Let's build your foundation first.

**3-Day Beginner Program (No Equipment Needed):**

**Day 1 — Full Body:**
- Jumping Jacks × 3 min (warm-up)
- Push-ups: 3 × 10
- Bodyweight Squats: 3 × 15
- Plank: 3 × 30 seconds
- Walking Lunges: 3 × 12 each leg

**Day 2 — Rest or Light Walk**
*(Karura Forest or Uhuru Park are perfect)*

**Day 3 — Core & Cardio:**
- 20 min brisk walk or jog
- Crunches: 3 × 20
- Bicycle Crunches: 3 × 15
- Mountain Climbers: 3 × 30 seconds

**Day 4 — Rest**

**Day 5 — Strength:**
- Dumbbell Rows (if you have): 3 × 12
- Tricep Dips: 3 × 10
- Glute Bridges: 3 × 20
- Lateral Raises: 3 × 12

**Nutrition (Kenya-Adapted):**
- Breakfast: 2 eggs + ugali or sweet potato
- Lunch: Sukuma wiki + grilled chicken + brown rice
- Dinner: Lentil stew (dengu) + chapati
- Snack: Avocado + boiled eggs

**Next Steps:**
[Book a Personal Trainer →](/services) | [Shop Fitness Gear →](/shop?category=fitness)`,
  },

  stylist: {
    default: `**Your Personalised Style Analysis**

**LookFinesse Style Guide — Nairobi Edition**

Nairobi has one of Africa's most exciting fashion scenes — blending Afrocentric prints with contemporary Western cuts.

**Your Signature Style Profile:**

**For Nairobi Everyday (Casual Chic):**
- Ankara crop top + high-waist jeans + white sneakers
- Kitenge blazer over a monochrome dress
- Linen set (breathable for Nairobi's warmth)

**For Corporate Nairobi:**
- Tailored blazer in a rich solid (navy, forest green, burgundy)
- Wide-leg trousers (elevated but comfortable)
- Minimal Maasai jewellery for subtle cultural nod

**For Going Out (Westlands/Kilimani):**
- Statement Ankara dress with structured heel
- Two-piece bodycon set in bold print
- Jumpsuits in silk or satin for rooftop events

**Color Palette for Melanin-Rich Skin:**
- Earth tones: terracotta, rust, burnt orange ✅
- Jewel tones: emerald, sapphire, amethyst ✅
- Caramel, gold, ivory ✅
- Avoid: washed-out pastels ❌

**Shop Your Style:**
[Explore Fashion →](/shop?category=fashion) | [Book a Styling Session →](/services)

**Top LookFinesse Picks:**
- Ankara Blazer (KES 4,500) — [Shop →](/shop)
- Bespoke Nairobi Suit (KES 28,000) — [Shop →](/shop)`,
  },

  concierge: {
    default: `**Your Nairobi Lifestyle Concierge**

Welcome! I'm your personal guide to the best LookFinesse has to offer in Nairobi.

**This Week's Curated Picks:**

**🏋️ Fitness & Wellness:**
- HIIT Bootcamp at EliteFit (Westlands) — KES 1,500 | [Book →](/services)
- Morning Yoga at Zen Wellness (Karen) — KES 1,200 | [Book →](/services)
- Online PT Session with FitQueen — KES 2,500 | [Book →](/services)

**💄 Beauty & Grooming:**
- Signature Facial at Glow Salon (Kilimani) — KES 3,500 | [Book →](/services)
- Natural Hair Styling — KES 4,800 | [Book →](/services)
- Precision Fade at Afrocuts (Westlands) — KES 1,800 | [Book →](/services)

**🛍️ Shop:**
- Korean Glass Skin Kit — KES 5,800 | [Shop →](/shop)
- Ankara Blazer — KES 4,500 | [Shop →](/shop)
- Resistance Band Set — KES 1,600 | [Shop →](/shop)

**📍 Nairobi Neighbourhood Guide:**
- **Westlands** — Fitness, nightlife, upscale dining
- **Kilimani** — Beauty salons, boutiques, cafés
- **Karen** — Wellness retreats, spas, outdoor activities
- **Lavington** — Fashion studios, independent boutiques

What experience are you looking for today? Tell me more and I'll personalise this further!`,
  },

  finance: {
    default: `**LookFinesse Marketplace Finance Overview**

**How Payments Work:**

**For Buyers:**
- Pay via M-Pesa, card, or LookFinesse wallet
- Funds held in escrow until delivery confirmed
- 7-day buyer protection on all orders

**For Vendors:**
- Payouts processed every Monday & Thursday
- 7% platform commission on products, 10% on services
- Instant wallet for tips and direct payments
- M-Pesa settlement within 24 hours

**Booking Deposits:**
- 30% deposit secures your appointment
- Balance due at service completion
- Free cancellation up to 24 hours before

**View Your Dashboard:** [Vendor Finance →](/vendor/finance) | [Dashboard →](/dashboard)

What specific finance question can I help you with?`,
  },
};

export function getDemoResponse(assistantType: string, message: string): string {
  const responses = DEMO_RESPONSES[assistantType] ?? DEMO_RESPONSES.concierge;
  const msgLower = message.toLowerCase();

  // Match specific topics
  if (assistantType === "beauty") {
    if (msgLower.includes("oily") || msgLower.includes("sebum") || msgLower.includes("shiny")) {
      return responses["oily skin"];
    }
    if (msgLower.includes("hyperpigment") || msgLower.includes("dark spot") || msgLower.includes("uneven")) {
      return responses["hyperpigmentation"];
    }
  }

  return responses.default ?? `I'm your AI ${assistantType} advisor. How can I help you today? Ask me anything about ${assistantType}!`;
}
