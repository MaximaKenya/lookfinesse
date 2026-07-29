-- ═══════════════════════════════════════════════════════════════════════════
-- VYB MARKETPLACE — RICH DEMO SEED DATA (Nairobi / Lifestyle)
-- ─────────────────────────────────────────────────────────────────────────
-- HOW TO RUN (fresh project):
--   1. Run supabase/migrations/000_fresh_bootstrap.sql — see docs/MIGRATIONS.md
--   2. Run supabase/seed_auth_users.sql — see docs/SEED_CREDENTIALS.md
--   3. Run supabase/seed_auth_roles.sql
--   4. Paste & run this file
--   5. Run supabase/seed_demo_metrics.sql — orders, wallets, ledger (non-zero KPIs)
--   6. Optional: 021_service_subscriptions.sql, 025_platform_subscription_trial.sql
-- NOTE: Uses ON CONFLICT DO NOTHING — safe to re-run
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  -- Vendors
  v_elitefit    uuid := 'a1000000-0000-0000-0000-000000000001';
  v_glow        uuid := 'a1000000-0000-0000-0000-000000000002';
  v_stylebnk    uuid := 'a1000000-0000-0000-0000-000000000003';
  v_zenwell     uuid := 'a1000000-0000-0000-0000-000000000004';
  v_fitqueen    uuid := 'a1000000-0000-0000-0000-000000000005';
  v_natubeauty  uuid := 'a1000000-0000-0000-0000-000000000006';
  v_afrocuts    uuid := 'a1000000-0000-0000-0000-000000000007';
  v_luxthread   uuid := 'a1000000-0000-0000-0000-000000000008';

  -- Products
  p1  uuid := 'b1000000-0000-0000-0000-000000000001';
  p2  uuid := 'b1000000-0000-0000-0000-000000000002';
  p3  uuid := 'b1000000-0000-0000-0000-000000000003';
  p4  uuid := 'b1000000-0000-0000-0000-000000000004';
  p5  uuid := 'b1000000-0000-0000-0000-000000000005';
  p6  uuid := 'b1000000-0000-0000-0000-000000000006';
  p7  uuid := 'b1000000-0000-0000-0000-000000000007';
  p8  uuid := 'b1000000-0000-0000-0000-000000000008';
  p9  uuid := 'b1000000-0000-0000-0000-000000000009';
  p10 uuid := 'b1000000-0000-0000-0000-000000000010';
  p11 uuid := 'b1000000-0000-0000-0000-000000000011';
  p12 uuid := 'b1000000-0000-0000-0000-000000000012';
  p13 uuid := 'b1000000-0000-0000-0000-000000000013';
  p14 uuid := 'b1000000-0000-0000-0000-000000000014';
  p15 uuid := 'b1000000-0000-0000-0000-000000000015';
  p16 uuid := 'b1000000-0000-0000-0000-000000000016';
  p17 uuid := 'b1000000-0000-0000-0000-000000000017';
  p18 uuid := 'b1000000-0000-0000-0000-000000000018';
  p19 uuid := 'b1000000-0000-0000-0000-000000000019';
  p20 uuid := 'b1000000-0000-0000-0000-000000000020';
  p21 uuid := 'b1000000-0000-0000-0000-000000000021';
  p22 uuid := 'b1000000-0000-0000-0000-000000000022';
  p23 uuid := 'b1000000-0000-0000-0000-000000000023';
  p24 uuid := 'b1000000-0000-0000-0000-000000000024';
  p25 uuid := 'b1000000-0000-0000-0000-000000000025';
  p26 uuid := 'b1000000-0000-0000-0000-000000000026';

  -- Services
  s1 uuid := 'c1000000-0000-0000-0000-000000000001';
  s2 uuid := 'c1000000-0000-0000-0000-000000000002';
  s3 uuid := 'c1000000-0000-0000-0000-000000000003';
  s4 uuid := 'c1000000-0000-0000-0000-000000000004';
  s5 uuid := 'c1000000-0000-0000-0000-000000000005';
  s6 uuid := 'c1000000-0000-0000-0000-000000000006';
  s7 uuid := 'c1000000-0000-0000-0000-000000000007';
  s8 uuid := 'c1000000-0000-0000-0000-000000000008';

  -- Feed posts
  fp1  uuid := 'd1000000-0000-0000-0000-000000000001';
  fp2  uuid := 'd1000000-0000-0000-0000-000000000002';
  fp3  uuid := 'd1000000-0000-0000-0000-000000000003';
  fp4  uuid := 'd1000000-0000-0000-0000-000000000004';
  fp5  uuid := 'd1000000-0000-0000-0000-000000000005';
  fp6  uuid := 'd1000000-0000-0000-0000-000000000006';
  fp7  uuid := 'd1000000-0000-0000-0000-000000000007';
  fp8  uuid := 'd1000000-0000-0000-0000-000000000008';
  fp9  uuid := 'd1000000-0000-0000-0000-000000000009';
  fp10 uuid := 'd1000000-0000-0000-0000-000000000010';
  fp11 uuid := 'd1000000-0000-0000-0000-000000000011';
  fp12 uuid := 'd1000000-0000-0000-0000-000000000012';
  fp13 uuid := 'd1000000-0000-0000-0000-000000000013';
  fp14 uuid := 'd1000000-0000-0000-0000-000000000014';
  fp15 uuid := 'd1000000-0000-0000-0000-000000000015';
  fp16 uuid := 'd1000000-0000-0000-0000-000000000016';
  fp17 uuid := 'd1000000-0000-0000-0000-000000000017';
  fp18 uuid := 'd1000000-0000-0000-0000-000000000018';

  -- Reels
  r1 uuid := 'e1000000-0000-0000-0000-000000000001';
  r2 uuid := 'e1000000-0000-0000-0000-000000000002';
  r3 uuid := 'e1000000-0000-0000-0000-000000000003';
  r4 uuid := 'e1000000-0000-0000-0000-000000000004';
  r5 uuid := 'e1000000-0000-0000-0000-000000000005';
  r6 uuid := 'e1000000-0000-0000-0000-000000000006';
  r7 uuid := 'e1000000-0000-0000-0000-000000000007';
  r8 uuid := 'e1000000-0000-0000-0000-000000000008';

  -- Live sessions
  l1 uuid := 'f1000000-0000-0000-0000-000000000001';
  l2 uuid := 'f1000000-0000-0000-0000-000000000002';
  l3 uuid := 'f1000000-0000-0000-0000-000000000003';
  l4 uuid := 'f1000000-0000-0000-0000-000000000004';
  l5 uuid := 'f1000000-0000-0000-0000-000000000005';

  -- Challenges
  ch1 uuid := '11000000-0000-4000-8000-000000000001';
  ch2 uuid := '11000000-0000-4000-8000-000000000002';
  ch3 uuid := '11000000-0000-4000-8000-000000000003';
  ch4 uuid := '11000000-0000-4000-8000-000000000004';

  -- Trending
  t1 uuid := '12000000-0000-4000-8000-000000000001';
  t2 uuid := '12000000-0000-4000-8000-000000000002';
  t3 uuid := '12000000-0000-4000-8000-000000000003';
  t4 uuid := '12000000-0000-4000-8000-000000000004';
  t5 uuid := '12000000-0000-4000-8000-000000000005';
  t6 uuid := '12000000-0000-4000-8000-000000000006';

  -- Collections
  col1 uuid := '13000000-0000-4000-8000-000000000001';
  col2 uuid := '13000000-0000-4000-8000-000000000002';

  -- Membership tiers
  mt1 uuid := '14000000-0000-4000-8000-000000000001';
  mt2 uuid := '14000000-0000-4000-8000-000000000002';
  mt3 uuid := '14000000-0000-4000-8000-000000000003';

  -- Affiliate links
  aff1 uuid := '15000000-0000-4000-8000-000000000001';
  aff2 uuid := '15000000-0000-4000-8000-000000000002';
  aff3 uuid := '15000000-0000-4000-8000-000000000003';
  aff4 uuid := '15000000-0000-4000-8000-000000000004';

  -- Ad campaigns
  ad1 uuid := '16000000-0000-4000-8000-000000000001';
  ad2 uuid := '16000000-0000-4000-8000-000000000002';
  ad3 uuid := '16000000-0000-4000-8000-000000000003';

  -- Staff
  st1 uuid := '17000000-0000-4000-8000-000000000001';
  st2 uuid := '17000000-0000-4000-8000-000000000002';
  st3 uuid := '17000000-0000-4000-8000-000000000003';
  st4 uuid := '17000000-0000-4000-8000-000000000004';

  -- Demo user (resolved from auth.users at runtime — see docs/SEED_CREDENTIALS.md)
  demo_user uuid;

BEGIN

-- Resolve demo buyer from auth.users (user@test.com, fallback vendor@test.com)
SELECT id INTO demo_user FROM auth.users WHERE email = 'user@test.com' LIMIT 1;
IF demo_user IS NULL THEN
  SELECT id INTO demo_user FROM auth.users WHERE email = 'vendor@test.com' LIMIT 1;
END IF;
IF demo_user IS NULL THEN
  RAISE NOTICE 'Skipping notifications & bookings: no auth user for user@test.com or vendor@test.com. Create auth users before seed.sql (see docs/SEED_CREDENTIALS.md).';
END IF;

-- ─── PRODUCT CATEGORIES (admin-managed) ───────────────────────────────────
INSERT INTO categories (name, slug, icon, sort_order, is_active)
VALUES
  ('Fashion',        'fashion',        '👗', 1,  true),
  ('Beauty',         'beauty',         '💄', 2,  true),
  ('Fitness',        'fitness',        '💪', 3,  true),
  ('Wellness',       'wellness',       '🧘', 4,  true),
  ('Footwear',       'footwear',       '👟', 5,  true),
  ('Accessories',    'accessories',    '👜', 6,  true),
  ('Skincare',       'skincare',       '✨', 7,  true),
  ('Hair',           'hair',           '💇', 8,  true),
  ('Nutrition',      'nutrition',      '🥗', 9,  true),
  ('Gym Equipment',  'gym-equipment',  '🏋️', 10, true),
  ('Grooming',       'grooming',       '💈', 11, true),
  ('Activewear',     'activewear',     '🏃', 12, true),
  ('Supplements',    'supplements',    '💊', 13, true),
  ('Jewellery',      'jewellery',      '💍', 14, true),
  ('Kids',           'kids',           '👶', 15, true),
  ('Men',            'men',            '👔', 16, true),
  ('Women',          'women',          '👩', 17, true),
  ('Makeup',         'makeup',         '💋', 18, true),
  ('Fragrance',      'fragrance',      '🌸', 19, true),
  ('Yoga & Pilates', 'yoga-pilates',   '🧘‍♀️', 20, true),
  ('Denim & Jeans',  'jeans',          '👖', 21, true)
ON CONFLICT (name) DO NOTHING;

-- ─── VENDORS (8 Nairobi creators with lat/lng) ────────────────────────────
INSERT INTO vendors (id, business_name, email, avatar_url, category, description, location, address, lat, lng, is_verified, specialty)
VALUES
  (v_elitefit,   'EliteFit Gym',        'elitefit@vyb.co.ke',   'https://api.dicebear.com/7.x/initials/svg?seed=EliteFit',    'fitness',  'Premium fitness studio in Westlands. Strength, cardio & HIIT. Nairobi''s most results-driven gym.',              'Westlands, Nairobi',  'Westlands Rd, Nairobi',  -1.2648, 36.8067, true,  ARRAY['fitness','hiit','strength','cardio']),
  (v_glow,       'Glow Salon & Spa',    'glow@vyb.co.ke',       'https://api.dicebear.com/7.x/initials/svg?seed=GlowSalon',   'beauty',   'Award-winning salon specialising in natural hair, Korean facials & spa treatments.',                            'Kilimani, Nairobi',   'Dennis Pritt Rd, Nairobi',-1.2916, 36.7836, true,  ARRAY['beauty','hair','facials','spa']),
  (v_stylebnk,   'Style Bank',          'style@vyb.co.ke',      'https://api.dicebear.com/7.x/initials/svg?seed=StyleBank',   'fashion',  'Curating the best of African fashion — ready-to-wear, custom pieces & accessories. Proudly Kenyan.',             'Lavington, Nairobi',  'James Gichuru Rd, Nairobi',-1.2833,36.7736, true,  ARRAY['fashion','style','accessories','ankara']),
  (v_zenwell,    'Zen Wellness Centre', 'zen@vyb.co.ke',        'https://api.dicebear.com/7.x/initials/svg?seed=ZenWellness', 'wellness', 'Holistic wellness: yoga, meditation, nutrition coaching & mindfulness. Serene Karen studio.',                    'Karen, Nairobi',      'Karen Rd, Nairobi',       -1.3362, 36.7057, false, ARRAY['wellness','yoga','nutrition','meditation']),
  (v_fitqueen,   'FitQueen Training',   'fitqueen@vyb.co.ke',   'https://api.dicebear.com/7.x/initials/svg?seed=FitQueen',    'fitness',  'Women-focused personal training, bootcamps & online programmes. Real results, real community.',                  'Parklands, Nairobi',  'Mpaka Rd, Nairobi',       -1.2553, 36.8064, true,  ARRAY['fitness','nutrition','womens-fitness']),
  (v_natubeauty, 'NaturalGlow Beauty',  'natuglow@vyb.co.ke',   'https://api.dicebear.com/7.x/initials/svg?seed=NaturalGlow', 'beauty',   'All-natural beauty products & routines for melanin-rich skin. Clean beauty for the modern African woman.',      'Kileleshwa, Nairobi', 'Kileleshwa Rd, Nairobi',  -1.2868, 36.7869, false, ARRAY['beauty','skincare','natural','melanin']),
  (v_afrocuts,   'Afrocuts Barbershop', 'afrocuts@vyb.co.ke',   'https://api.dicebear.com/7.x/initials/svg?seed=Afrocuts',    'grooming', 'Premium men''s grooming. Fades, locs, beards & bespoke cuts. Appointment only.',                               'Westlands, Nairobi',  'Waiyaki Way, Nairobi',    -1.2637, 36.8100, true,  ARRAY['grooming','barbershop','mens']),
  (v_luxthread,  'Lux Thread Studio',   'luxthread@vyb.co.ke',  'https://api.dicebear.com/7.x/initials/svg?seed=LuxThread',   'fashion',  'Bespoke tailoring for the modern Nairobian. Suits, traditional wear & contemporary African prints.',            'CBD, Nairobi',        'Kenyatta Ave, Nairobi',   -1.2864, 36.8173, true,  ARRAY['fashion','tailoring','bespoke','suits'])
ON CONFLICT (id) DO NOTHING;

-- ─── CREATOR PROFILES ──────────────────────────────────────────────────────
INSERT INTO creator_profiles (vendor_id, bio, specialty, verified, subscriber_count, total_posts, rating, cover_image)
VALUES
  (v_elitefit,   'Nairobi''s top fitness brand. Helping you build strength, confidence & community since 2018.',  ARRAY['fitness','hiit','strength'],    true,  3420, 48, 4.9, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200'),
  (v_glow,       'Beauty is self-care. Join us for a radiant glow-up journey. 5-star rated, 8 years strong.',    ARRAY['beauty','hair','facials'],       true,  2180, 36, 4.8, 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200'),
  (v_stylebnk,   'Defining African luxury fashion. Bold prints, clean cuts, timeless pieces. Global audience.',   ARRAY['fashion','style'],               true,  5100, 72, 4.7, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200'),
  (v_zenwell,    'Breathe. Move. Be. Holistic wellness for the modern Nairobian. Karen''s hidden gem.',            ARRAY['wellness','yoga','nutrition'],   false, 890,  24, 4.6, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200'),
  (v_fitqueen,   'Real results for real women. Fitness coach, nutritionist & your biggest cheerleader.',           ARRAY['fitness','nutrition'],           true,  4250, 60, 4.9, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200'),
  (v_natubeauty, 'Clean beauty for melanin magic. Ingredients your skin actually loves. Dermatologist-approved.', ARRAY['beauty','skincare'],             false, 1340, 30, 4.5, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200'),
  (v_afrocuts,   'Barbershop culture elevated. Precision cuts, masterclass grooming. Appointment only.',           ARRAY['grooming','barbershop'],         true,  980,  18, 4.8, 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200'),
  (v_luxthread,  'Every seam tells a story. Bespoke tailoring rooted in African heritage. Ships worldwide.',       ARRAY['fashion','tailoring'],           true,  2200, 42, 4.9, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200')
ON CONFLICT (vendor_id) DO NOTHING;

-- ─── PRODUCTS (24 across categories) ──────────────────────────────────────
-- Categories: fashion, beauty, fitness, wellness, accessories, grooming
INSERT INTO products (id, vendor_id, name, description, price, category, image_url, stock_quantity, is_active)
VALUES
  -- FASHION (7)
  (p1,  v_stylebnk,   'Ankara Blazer — Desert Gold',          'Hand-tailored Ankara blazer. Structured fit. Premium woven fabric from Kumasi markets.',   4500,  'fashion',     'https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=800', 20,  true),
  (p2,  v_stylebnk,   'Wrap Skirt — Tribal Bloom',            'Bold floral wrap skirt. Versatile length. Machine washable. Sizes XS-XL.',                  2200,  'fashion',     'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800', 35,  true),
  (p18, v_stylebnk,   'Kente Crop Top — Ivory',               'Woven kente crop. Festival & everyday. Adjustable tie back.',                               1800,  'fashion',     'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800', 45,  true),
  (p19, v_luxthread,  'Bespoke Nairobi Suit — Charcoal',      'Full bespoke suit. 2-week turnaround. Premium wool-blend. Includes 2 fittings.',            28000, 'fashion',     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', 5,   true),
  (p20, v_luxthread,  'Kitenge Shirt — Modern Fit',           'Contemporary kitenge print shirt. Slim cut. Moisture-wicking lining.',                      2800,  'fashion',     'https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=800', 30,  true),
  (p21, v_stylebnk,   'Beaded Necklace — Maasai Gold',        'Handcrafted Maasai beadwork. Gold & red. Fair-trade certified artisans.',                   1500,  'accessories', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800', 60,  true),
  (p22, v_luxthread,  'Ankara Print Sneakers',                 'Custom hand-painted sneakers. Ankara fabric finish. Limited run of 50.',                   5500,  'fashion',     'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', 8,   true),
  (p25, v_stylebnk,   'High-Rise Straight Jeans — Indigo',     'Premium stretch denim. High-rise straight leg. Sizes 24–36.',                               4200,  'jeans',       'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', 35,  true),
  (p26, v_luxthread,  'Tailored Wide-Leg Jeans — Stone Wash',  'Bespoke-fit wide leg. Stone wash finish. Nairobi atelier.',                                5800,  'jeans',       'https://images.unsplash.com/photo-1475178626629-edd718aabd6?w=800', 22,  true),
  -- BEAUTY (6)
  (p3,  v_glow,       'Vitamin C Brightening Serum',          '15% stabilized Vitamin C. Fades dark spots, boosts radiance. 30ml.',                        1800,  'beauty',      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800', 50,  true),
  (p4,  v_natubeauty, 'Shea & Argan Hair Butter',             'Deep conditioning butter for natural hair. No silicones or sulfates. 250g.',                 1200,  'beauty',      'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800', 80,  true),
  (p13, v_natubeauty, 'Black Seed Facial Oil',                'Cold-pressed Nigella Sativa oil. Calms acne, reduces hyperpigmentation. 30ml.',             2100,  'beauty',      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800', 40,  true),
  (p14, v_glow,       'Korean Glass Skin Kit',                 '4-piece set: toner, essence, moisturiser, SPF50 sunscreen. All skin types.',               5800,  'beauty',      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800', 25,  true),
  (p23, v_natubeauty, 'Turmeric Brightening Mask',            'Kaolin clay + turmeric + rosewater. Brightens & detoxifies. 100g.',                         900,   'beauty',      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800', 100, true),
  (p24, v_glow,       'Scalp Revival Treatment',              'Salicylic acid + peppermint. Clears scalp buildup, reduces dandruff. 150ml.',               1600,  'beauty',      'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800', 55,  true),
  -- FITNESS (4)
  (p5,  v_elitefit,   'Performance Gym Bag — Black',          'Waterproof ripstop. Shoe compartment. Fits all your gym gear. 40L.',                        3200,  'fitness',     'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', 15,  true),
  (p15, v_elitefit,   'Resistance Band Set (5 levels)',       'Latex-free bands: XS to XXL resistance. Comes with carry bag & guide.',                     1600,  'fitness',     'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', 60,  true),
  (p16, v_fitqueen,   'FitQueen Sports Bra — Midnight',       'High-impact support. Moisture-wicking. 4-way stretch. Sizes XS–3XL.',                       2400,  'fitness',     'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', 40,  true),
  (p17, v_elitefit,   'Foam Roller — Deep Tissue',            'High-density foam. 33cm. Trigger point texture. Reduces DOMS by 40%.',                      2800,  'fitness',     'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', 30,  true),
  -- WELLNESS (4)
  (p6,  v_zenwell,    'Mindfulness Journal — Vyb Edition',    'Guided prompts for daily reflection. Premium linen cover. 90 days.',                         850,   'wellness',    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800', 100, true),
  (p7,  v_zenwell,    'Organic Herbal Tea — Calm Blend',      'Chamomile, lavender, passionflower. Reduces cortisol. 30 sachets.',                          650,   'wellness',    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800', 80,  true),
  (p8,  v_zenwell,    'Yoga Block Set (2 pcs)',               'High-density cork. Non-slip. Ideal for all yoga levels.',                                    1200,  'wellness',    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', 35,  true),
  -- GROOMING (3)
  (p9,  v_afrocuts,   'Afrocuts Beard Oil — Cedarwood',       'Jojoba + argan + cedarwood essential oil. Softens, conditions & adds shine. 50ml.',          1400,  'grooming',   'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800', 70,  true),
  (p10, v_afrocuts,   'Fade Maintenance Kit',                 'Trimmers guide, edge-up razor + 2 premium clipper guards. Barber-grade.',                   3800,  'grooming',   'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800', 20,  true),
  -- ACCESSORIES (2)
  (p11, v_stylebnk,   'Ankara Tote Bag — Limited',            'Handmade Ankara fabric tote. Reinforced handles. Laptop-ready. 15L.',                       2800,  'accessories', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', 25,  true),
  (p12, v_stylebnk,   'Kiondo Basket Bag',                    'Hand-woven sisal. Traditional Kenyan craft. Leather handles. Limited.',                     3500,  'accessories', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', 18,  true)
ON CONFLICT (id) DO NOTHING;

-- ─── SERVICES ──────────────────────────────────────────────────────────────
INSERT INTO services (id, vendor_id, title, short_description, description, price, category, duration_minutes, is_virtual, is_in_person, cover_image, max_participants, status, bookings_count)
VALUES
  (s1, v_elitefit,   'HIIT Bootcamp — 60 mins',       'High-intensity interval training for all levels.',             'Power-packed 60-minute HIIT session combining strength and cardio. Equipment provided. Suitable for beginners and advanced athletes. Max 15 participants.',  1500, 'fitness',  60,  false, true,  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', 15, 'active', 142),
  (s2, v_glow,       'Signature Facial Treatment',     'Deep cleanse, exfoliation & hydration boost.',                 'Award-winning 75-minute facial using Korean skincare technology. Includes double cleanse, enzyme peel, jade roller massage & LED therapy. 1 person.',     3500, 'beauty',   75,  false, true,  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800', 1,  'active', 98),
  (s3, v_fitqueen,   'Online PT Session — 45 mins',   'Personalised virtual workout with certified trainer.',          '1-on-1 virtual personal training. Customised program, real-time coaching & weekly check-ins. Perfect for busy professionals.',                             2500, 'fitness',  45,  true,  false, 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800', 1,  'active', 210),
  (s4, v_glow,       'Natural Hair Styling',           'Braids, twists, locs & protective styles.',                    'Full natural hair styling service. Consultation included. Choose from knotless braids, Senegalese twists, butterfly locs & more. Products provided.',       4800, 'beauty',   180, false, true,  'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800', 1,  'active', 76),
  (s5, v_zenwell,    'Yoga & Breathwork — Morning',   'Sunrise flow + pranayama for calm and clarity.',               'Grounding 60-minute morning practice blending Vinyasa flow yoga with guided breathwork. Mats provided. Set in our garden studio in Karen.',                  1200, 'wellness', 60,  false, true,  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', 12, 'active', 88),
  (s6, v_zenwell,    'Nutrition Coaching — 4 weeks',  '4-week personalised nutrition plan & weekly check-ins.',        'Tailored nutrition guidance for your lifestyle goals — weight management, energy, sports performance or gut health. Weekly 30-min video calls + meal plans.', 8500, 'wellness', 30,  true,  false, 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800', 1,  'active', 45),
  (s7, v_afrocuts,   'Signature Fade + Beard',        'Precision skin fade with beard sculpt & hot towel.',           'Full barbershop experience: skin fade, beard sculpt, hot towel shave & edge-up. Takes about 60 mins. Appointment only.',                                       1800, 'grooming', 60,  false, true,  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800', 1,  'active', 320),
  (s8, v_luxthread,  'Bespoke Suit Consultation',     'Full measurement session + fabric selection for your suit.',    '90-min in-studio consultation. We take 22 body measurements, help you select fabric & lining, and design the perfect suit. Deposit required.',                2000, 'fashion',  90,  false, true,  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', 1,  'active', 54)
ON CONFLICT (id) DO NOTHING;

-- ─── FEED POSTS (18 varied types) ─────────────────────────────────────────
INSERT INTO feed_posts (id, vendor_id, type, feed_category, caption, thumbnail_url, product_id, hashtags, engagement_score)
VALUES
  (fp1,  v_stylebnk,   'style_drop',     'style',   'New season, new you. The Ankara Blazer just dropped 🔥 Shop the link in bio.',                                  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',  p1,  ARRAY['#AnkaraFashion','#NairobiStyle','#AfricanFashion'], 92),
  (fp2,  v_elitefit,   'transformation', 'fitness', '6-week transformation done. No excuses, only results 💪 Tag a friend who needs this.',                           'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', NULL,ARRAY['#FitnessGoals','#NairobiGym','#HIIT'],             88),
  (fp3,  v_glow,       'tutorial',       'beauty',  'Glass skin in 3 steps 🌟 Full routine breakdown — save this post! Products linked below.',                       'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800', p3,  ARRAY['#GlassSkin','#SkincareRoutine','#NairobiBeauty'],   95),
  (fp4,  v_fitqueen,   'workout',        'fitness', '20-min no-equipment morning routine. Do this before your coffee ☕ Save for tomorrow!',                           'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', NULL,ARRAY['#MorningWorkout','#HomeWorkout','#FitQueen'],      78),
  (fp5,  v_zenwell,    'tutorial',       'wellness','5 breathing exercises to reduce cortisol and improve focus. Screenshot this 🧘',                                   'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', NULL,ARRAY['#Wellness','#Breathwork','#MindfulNairobi'],       70),
  (fp6,  v_natubeauty, 'before_after',   'beauty',  '30 days of consistent skincare 🌿 The black seed oil REALLY works. Before/after inside 👀',                      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800', p13, ARRAY['#NaturalBeauty','#BeforeAfter','#SkincareTok'],     85),
  (fp7,  v_afrocuts,   'product',        'style',   'New drop: Beard Oil just landed in store 🧴 Cedarwood + Jojoba. Smells unreal.',                                 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800', p9,  ARRAY['#BeardCare','#MensGrooming','#NairobiBarber'],     74),
  (fp8,  v_luxthread,  'style_drop',     'style',   'The Nairobi Suit collection is here 🕴️ Bespoke, ready in 14 days. DM to book your consultation.',               'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', p19, ARRAY['#BespokeSuits','#AfricanMensFashion','#LuxThread'], 82),
  (fp9,  v_elitefit,   'workout',        'fitness', 'Saturday 7AM bootcamp is BACK 🌅 45 spots only. Link in bio to reserve.',                                         'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', NULL,ARRAY['#BootCamp','#Westlands','#SaturdaySweat'],         91),
  (fp10, v_glow,       'product',        'beauty',  'Korean Glass Skin Kit is BACK in stock 🇰🇷 Sold out twice already. Grab yours now!',                              'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800', p14, ARRAY['#KoreanSkincare','#GlowUpNairobi','#GlowSalon'],    88),
  (fp11, v_fitqueen,   'transformation', 'fitness', 'Client Wanjiku lost 14kg in 12 weeks 🏆 Pure dedication + my programme. Her words: "life-changing".',             'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800', NULL,ARRAY['#WeightLoss','#ClientResults','#FitQueen'],        96),
  (fp12, v_zenwell,    'tutorial',       'wellness','Morning yoga sequence for office workers 🧘 5 poses, 10 minutes. Your back will thank you.',                       'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', NULL,ARRAY['#OfficYoga','#WellnessNairobi','#Karen'],           67),
  (fp13, v_stylebnk,   'style_drop',     'style',   'Kiondo is the new Birkin 🧺 Limited restock. Each bag hand-woven by artisans in Machakos.',                       'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',  p12, ARRAY['#AfricanFashion','#Kiondo','#SupportLocal'],        79),
  (fp14, v_natubeauty, 'tutorial',       'beauty',  'DIY turmeric mask recipe for glowing skin ✨ Save this for Sunday self-care.',                                    'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800',  NULL,ARRAY['#DIYSkincare','#TurmericGlow','#NaturalGlow'],     72),
  (fp15, v_afrocuts,   'product',        'style',   'Edge-up season is here 💈 Book your spot for the weekend. Limited appointments.',                                  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800', NULL,ARRAY['#Barbershop','#Nairobi','#FadeGod'],               83),
  (fp16, v_elitefit,   'product',        'fitness', 'Resistance band set is here 💪 No gym? No excuse. 5 levels, one bag.',                                             'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', p15, ARRAY['#ResistanceBands','#HomeGym','#EliteFit'],          76),
  (fp17, v_luxthread,  'tutorial',       'style',   'How to care for your Kitenge shirt 🧵 Thread by thread, a guide to African fabric care.',                          'https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=800', NULL,ARRAY['#AfricanFabric','#Kitenge','#StyleTips'],           61),
  (fp18, v_zenwell,    'product',        'wellness','Calm tea blend is restocked 🍵 Chamomile + lavender + passionflower. 30 sachets for stressful days.',             'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800',  p7,  ARRAY['#WellnessTea','#SelfCare','#ZenWellness'],           58)
ON CONFLICT (id) DO NOTHING;

-- ─── REELS (8 with sample video URLs) ─────────────────────────────────────
INSERT INTO reels (id, vendor_id, caption, video_url, thumbnail_url, product_id, engagement_score)
VALUES
  (r1, v_elitefit,   'Saturday morning HIIT session 🔥 Spot is limited, DM to book.',     'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',     'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600', p5,  9420),
  (r2, v_glow,       'GRWM: Full glam in 10 minutes using drugstore products 💄',          'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',         'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600', p3,  7800),
  (r3, v_stylebnk,   'Nairobi rooftop photoshoot BTS 📸 Full collection now live!',         'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',       'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', p1,  12100),
  (r4, v_fitqueen,   '30-day abs challenge day 1 💪 Save this for tomorrow morning.',       'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',     'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600', NULL, 8650),
  (r5, v_natubeauty, 'My 5-step natural skincare routine 🌿 All products in bio.',         'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4','https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600', p13, 5600),
  (r6, v_zenwell,    'Karen sunrise yoga 🌅 Join us every weekday 6AM.',                   'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',         'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600', NULL, 4200),
  (r7, v_afrocuts,   'Skin fade timelapse in 60 seconds 💈 Book: afrocuts.co.ke',          'https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanDo.mp4',         'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600', p9, 11300),
  (r8, v_luxthread,  'Watch this custom suit come to life in 14 days 🧵',                  'https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', p19, 6700)
ON CONFLICT (id) DO NOTHING;

-- ─── LIVE SESSIONS (5: 2 live, 3 upcoming) ────────────────────────────────
INSERT INTO live_sessions (id, vendor_id, title, description, scheduled_for, is_live, cover_url, stream_url, viewer_count)
VALUES
  (l1, v_elitefit,  'Full Body HIIT — Live Burn',         '45-min live HIIT workout. No equipment needed. All levels welcome!',   now() + interval '1 hour',   true,  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200', 'https://www.youtube.com/embed/live_stream?channel=UCxxxxxx', 143),
  (l2, v_fitqueen,  'FitQueen Live: Booty & Core',        'Live 45-min glutes & core session. Grab your mat!',                    now() + interval '2 hours',  true,  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200', 'https://www.youtube.com/embed/live_stream?channel=UCyyyyyy', 87),
  (l3, v_glow,      'Skincare Masterclass: Know Your Skin','Live Q&A + product demos. Learn your skin type and build your routine.',now() + interval '1 day',   false, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200', NULL, 0),
  (l4, v_stylebnk,  'SS2026 Collection Drop — Live',      'Be the first to shop the new season. Exclusive live-only discounts!',  now() + interval '3 days',  false, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200', NULL, 0),
  (l5, v_zenwell,   'Guided Meditation + Q&A',            'Live 30-min breathwork & meditation. Bring a journal.',                 now() + interval '5 days',  false, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200', NULL, 0)
ON CONFLICT (id) DO NOTHING;

-- ─── AVAILABILITY SLOTS (next 2 weeks) ────────────────────────────────────
INSERT INTO availability_slots (vendor_id, service_id, starts_at, ends_at, is_booked)
VALUES
  -- EliteFit HIIT
  (v_elitefit, s1, now() + interval '1 day 7 hours',   now() + interval '1 day 8 hours',    false),
  (v_elitefit, s1, now() + interval '2 days 7 hours',  now() + interval '2 days 8 hours',   false),
  (v_elitefit, s1, now() + interval '3 days 7 hours',  now() + interval '3 days 8 hours',   true),
  (v_elitefit, s1, now() + interval '4 days 7 hours',  now() + interval '4 days 8 hours',   false),
  (v_elitefit, s1, now() + interval '7 days 7 hours',  now() + interval '7 days 8 hours',   false),
  (v_elitefit, s1, now() + interval '9 days 7 hours',  now() + interval '9 days 8 hours',   false),
  -- Glow facial
  (v_glow, s2, now() + interval '1 day 10 hours',  now() + interval '1 day 11 hours 15 minutes', false),
  (v_glow, s2, now() + interval '2 days 10 hours', now() + interval '2 days 11 hours 15 minutes',false),
  (v_glow, s2, now() + interval '3 days 14 hours', now() + interval '3 days 15 hours 15 minutes',true),
  (v_glow, s2, now() + interval '5 days 10 hours', now() + interval '5 days 11 hours 15 minutes',false),
  (v_glow, s2, now() + interval '8 days 10 hours', now() + interval '8 days 11 hours 15 minutes',false),
  -- Glow hair
  (v_glow, s4, now() + interval '1 day 9 hours',  now() + interval '1 day 12 hours',  false),
  (v_glow, s4, now() + interval '3 days 9 hours',  now() + interval '3 days 12 hours', false),
  (v_glow, s4, now() + interval '6 days 9 hours',  now() + interval '6 days 12 hours', true),
  -- FitQueen online PT
  (v_fitqueen, s3, now() + interval '1 day 8 hours',  now() + interval '1 day 8 hours 45 minutes', false),
  (v_fitqueen, s3, now() + interval '2 days 8 hours', now() + interval '2 days 8 hours 45 minutes',false),
  (v_fitqueen, s3, now() + interval '4 days 16 hours',now() + interval '4 days 16 hours 45 minutes',false),
  (v_fitqueen, s3, now() + interval '8 days 8 hours', now() + interval '8 days 8 hours 45 minutes',false),
  -- Zen yoga
  (v_zenwell, s5, now() + interval '1 day 6 hours',  now() + interval '1 day 7 hours',   false),
  (v_zenwell, s5, now() + interval '2 days 6 hours', now() + interval '2 days 7 hours',  false),
  (v_zenwell, s5, now() + interval '3 days 6 hours', now() + interval '3 days 7 hours',  false),
  (v_zenwell, s5, now() + interval '5 days 6 hours', now() + interval '5 days 7 hours',  true),
  -- Afrocuts barber
  (v_afrocuts, s7, now() + interval '1 day 9 hours',  now() + interval '1 day 10 hours', false),
  (v_afrocuts, s7, now() + interval '1 day 11 hours', now() + interval '1 day 12 hours', true),
  (v_afrocuts, s7, now() + interval '2 days 9 hours', now() + interval '2 days 10 hours',false),
  (v_afrocuts, s7, now() + interval '2 days 11 hours',now() + interval '2 days 12 hours',false),
  (v_afrocuts, s7, now() + interval '3 days 9 hours', now() + interval '3 days 10 hours',false),
  -- Lux Thread
  (v_luxthread, s8, now() + interval '2 days 10 hours',now() + interval '2 days 11 hours 30 minutes',false),
  (v_luxthread, s8, now() + interval '4 days 10 hours',now() + interval '4 days 11 hours 30 minutes',false),
  (v_luxthread, s8, now() + interval '7 days 10 hours',now() + interval '7 days 11 hours 30 minutes',false)
ON CONFLICT DO NOTHING;

-- ─── STORIES ───────────────────────────────────────────────────────────────
INSERT INTO stories (vendor_id, media_url, media_type, caption, expires_at)
VALUES
  (v_elitefit,   'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',  'image', 'Morning session was 🔥 Slots still open today!',          now() + interval '20 hours'),
  (v_elitefit,   'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',  'image', 'New resistance bands now in store 💪',                    now() + interval '18 hours'),
  (v_glow,       'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800',  'image', 'New facial just added 💆 Book via the link!',             now() + interval '22 hours'),
  (v_glow,       'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800',     'image', 'Korean Glass Skin Kit is BACK IN STOCK 🇰🇷',             now() + interval '20 hours'),
  (v_stylebnk,   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',     'image', 'SS2026 launch is 3 days away 🔥',                         now() + interval '22 hours'),
  (v_stylebnk,   'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',     'image', 'Kiondo restock — 18 left! 🧺',                           now() + interval '16 hours'),
  (v_fitqueen,   'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800',  'image', 'Virtual PT now available 📱 DM to book your first session',now() + interval '19 hours'),
  (v_zenwell,    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',     'image', 'Karen 6AM yoga — start your day right 🌅',                now() + interval '21 hours'),
  (v_natubeauty, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',  'image', 'New: Turmeric Brightening Mask ✨ Limited launch batch!',  now() + interval '23 hours'),
  (v_afrocuts,   'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800',  'image', 'Appointment slots open for this weekend 💈',              now() + interval '17 hours'),
  (v_luxthread,  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',  'image', 'New bespoke consultation slots — book via profile 🕴️',   now() + interval '20 hours')
ON CONFLICT DO NOTHING;

-- ─── TRENDING TOPICS ───────────────────────────────────────────────────────
INSERT INTO trending_topics (id, title, category, score, cover_url)
VALUES
  (t1, '#GlowUp2026 — Natural beauty is trending',             'beauty',  95, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800'),
  (t2, 'Morning HIIT Revolution hits Nairobi',                 'fitness', 88, 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800'),
  (t3, 'Ankara Street Style: A Visual Manifesto',              'fashion', 82, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
  (t4, 'Gut Health & Wellness: The 2026 Guide',                'wellness',75, 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800'),
  (t5, 'The Fade Culture: Nairobi Barbershop Scene',           'grooming',68, 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800'),
  (t6, 'Bespoke is Back: African Tailoring Renaissance',       'fashion', 71, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800')
ON CONFLICT (id) DO NOTHING;

-- ─── CHALLENGES ────────────────────────────────────────────────────────────
INSERT INTO challenges (id, title, description, category, start_date, end_date, participant_count, cover_url)
VALUES
  (ch1, '30-Day Glow Challenge',    'Daily skincare routine for 30 days. Post your before & after.',    'beauty',  now(),                    now() + interval '30 days', 1240, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800'),
  (ch2, 'Nairobi Fit Week',         '7 days of daily workouts. Complete all 7 to earn your badge.',     'fitness', now(),                    now() + interval '7 days',  3560, 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800'),
  (ch3, 'Style Your Roots',         'Wear African-inspired fashion for 5 days. Share your looks.',      'fashion', now() + interval '3 days',now() + interval '33 days', 890,  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
  (ch4, 'Wellness September',       '21-day wellness journey: move, eat well, reflect daily.',          'wellness',now() - interval '5 days',now() + interval '16 days', 2100, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800')
ON CONFLICT (id) DO NOTHING;

-- ─── STAFF MEMBERS ─────────────────────────────────────────────────────────
INSERT INTO staff_members (id, vendor_id, name, role, avatar_url, is_active)
VALUES
  (st1, v_elitefit,  'Brian Kamau',    'Head Trainer',       'https://api.dicebear.com/7.x/initials/svg?seed=BrianKamau',    true),
  (st2, v_elitefit,  'Faith Wanjiku',  'Nutrition Coach',    'https://api.dicebear.com/7.x/initials/svg?seed=FaithWanjiku',  true),
  (st3, v_glow,      'Aisha Mohammed', 'Senior Stylist',     'https://api.dicebear.com/7.x/initials/svg?seed=AishaMohammed', true),
  (st4, v_glow,      'Lilian Otieno',  'Facial Specialist',  'https://api.dicebear.com/7.x/initials/svg?seed=LilianOtieno',  true)
ON CONFLICT (id) DO NOTHING;

-- ─── MEMBERSHIP TIERS ──────────────────────────────────────────────────────
INSERT INTO membership_tiers (id, vendor_id, name, price, currency, billing_period, perks, is_active)
VALUES
  (mt1, v_elitefit, 'Fan',        500,  'KES', 'monthly', ARRAY['Early access to session bookings','Monthly workout plan PDF','Members-only feed updates'],            true),
  (mt2, v_elitefit, 'Pro Member', 1500, 'KES', 'monthly', ARRAY['Unlimited class bookings','1 virtual PT per month','Exclusive live sessions','Merch discounts 20%'],   true),
  (mt3, v_glow,     'Glow Club',  800,  'KES', 'monthly', ARRAY['10% off all treatments','Priority booking','Members-only product launches','Monthly skincare box'],    true)
ON CONFLICT (id) DO NOTHING;

-- ─── AFFILIATE LINKS ───────────────────────────────────────────────────────
INSERT INTO affiliate_links (id, vendor_id, code, commission_pct, description, clicks, conversions, is_active)
VALUES
  (aff1, v_elitefit,   'ELITEFIT20',   15, 'EliteFit referral programme — earn 15% on each booking.',    340, 28, true),
  (aff2, v_glow,       'GLOWSALON10',  10, 'Glow Salon referral — 10% on each treatment booked.',        210, 19, true),
  (aff3, v_stylebnk,   'STYLEBNK15',   15, 'Style Bank — earn 15% on fashion & accessories sales.',       560, 44, true),
  (aff4, v_fitqueen,   'FITQUEEN25',   20, 'FitQueen referral — earn 20% on all online PT bookings.',     180, 15, true)
ON CONFLICT (id) DO NOTHING;

-- ─── AD CAMPAIGNS ──────────────────────────────────────────────────────────
INSERT INTO ad_campaigns (id, vendor_id, product_id, title, headline, description, image_url, cta_text, cta_url, target_categories, target_location, daily_budget, total_budget, bid_amount, start_at, end_at, status, total_impressions, total_clicks)
VALUES
  (ad1, v_stylebnk, p1,  'Ankara Blazer Launch',     'New Season Ankara is HERE',    'Desert Gold blazer — limited stock. Hand-tailored.',         'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'Shop Now',  '/shop?category=fashion', ARRAY['fashion','style'],          'Nairobi', 2000, 40000,  25, now() - interval '5 days', now() + interval '25 days', 'live', 8420,  312),
  (ad2, v_elitefit, NULL,'HIIT Bootcamp Promo',       'Burn Calories, Build Community','45-min HIIT. All levels. First session FREE.',               'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800','Book Free', '/services',              ARRAY['fitness','wellness'],       'Nairobi', 1500, 30000,  20, now() - interval '3 days', now() + interval '27 days', 'live', 5600,  198),
  (ad3, v_glow,     p14, 'Glass Skin Kit Flash Sale', 'Korean Skincare — 20% Off',    'Limited stock. All 4 steps for glass skin.',                 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800','Shop Sale', '/shop?category=beauty',  ARRAY['beauty'],                   'Nairobi', 1000, 15000,  15, now() - interval '1 day',  now() + interval '7 days',  'live', 3200,  145)
ON CONFLICT (id) DO NOTHING;

-- ─── PLATFORM SUBSCRIPTIONS (vendor@test.com → EliteFit Pro trial) ───────────
-- Prefer trialing so dashboard shows the free-trial banner; skip overwrite if already paid active.
INSERT INTO platform_subscriptions (
  vendor_id, user_id, tier, status, price_kes, payment_method,
  ad_credits_remaining, current_period_start, current_period_end, trial_ends_at
)
SELECT
  v_elitefit,
  u.id,
  'pro',
  'trialing',
  0,
  NULL,
  2500,
  now(),
  now() + interval '30 days',
  now() + interval '30 days'
FROM auth.users u
WHERE u.email = 'vendor@test.com'
ON CONFLICT (vendor_id) DO UPDATE SET
  tier = EXCLUDED.tier,
  status = EXCLUDED.status,
  price_kes = EXCLUDED.price_kes,
  user_id = EXCLUDED.user_id,
  ad_credits_remaining = EXCLUDED.ad_credits_remaining,
  current_period_start = EXCLUDED.current_period_start,
  current_period_end = EXCLUDED.current_period_end,
  trial_ends_at = EXCLUDED.trial_ends_at
WHERE platform_subscriptions.status IS DISTINCT FROM 'active'
   OR platform_subscriptions.payment_method IS NULL;

-- ─── NOTIFICATIONS & BOOKINGS (demo user — requires auth.users) ─────────────
IF demo_user IS NOT NULL THEN
  INSERT INTO notifications (user_id, type, title, message, image_url, link_url, is_read)
  VALUES
    (demo_user, 'new_follower',  'EliteFit is now following you!',        'EliteFit Gym started following your activity.',                      'https://api.dicebear.com/7.x/initials/svg?seed=EliteFit',    '/creator/a1000000-0000-0000-0000-000000000001', false),
    (demo_user, 'booking',       'Booking confirmed: HIIT Bootcamp',       'Your HIIT session is confirmed for tomorrow at 7AM.',               'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', '/bookings', false),
    (demo_user, 'live_starting', 'EliteFit is going LIVE in 30 minutes',   'Full Body HIIT live session starts at 7PM. Set a reminder!',       'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', '/live',     true),
    (demo_user, 'product_drop',  'New Style Bank drop is here!',            'The Ankara Blazer collection just launched. Shop before it sells out.','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800','/shop',     true)
  ON CONFLICT DO NOTHING;

  INSERT INTO bookings (vendor_id, user_id, service_id, total_amount, status, payment_status, notes, participants)
  VALUES
    (v_elitefit, demo_user, s1, 1500, 'confirmed',  'paid',    'Saturday 7AM bootcamp. Bring water.', 1),
    (v_glow,     demo_user, s2, 3500, 'completed',  'paid',    'Amazing facial, skin is glowing!', 1),
    (v_fitqueen, demo_user, s3, 2500, 'pending',    'pending', 'First virtual PT session.', 1)
  ON CONFLICT DO NOTHING;
END IF;

END $$;
