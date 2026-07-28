-- Canonical marketplace categories (streamlined — no standalone jeans slug)

ALTER TABLE categories ADD COLUMN IF NOT EXISTS description text;

INSERT INTO categories (slug, name, description, icon, sort_order, is_active)
VALUES
  ('fashion', 'Fashion', 'Ready-to-wear & statement pieces', '👗', 1, true),
  ('beauty', 'Beauty', 'Makeup, glow & self-care', '💄', 2, true),
  ('fitness', 'Fitness', 'Training gear & active lifestyle', '💪', 3, true),
  ('wellness', 'Wellness', 'Mind, body & calm', '🧘', 4, true),
  ('skincare', 'Skincare', 'Serums, routines & treatments', '✨', 5, true),
  ('photography', 'Photography', 'Portraits & content creation', '📸', 6, true),
  ('nutrition', 'Nutrition', 'Supplements & meal plans', '🥗', 7, true),
  ('footwear', 'Footwear', 'Sneakers, heels & everyday steps', '👟', 8, true),
  ('accessories', 'Accessories', 'Bags, jewelry & extras', '👜', 9, true),
  ('hair', 'Hair', 'Styling & care', '💇', 10, true),
  ('grooming', 'Grooming', 'Barber & beard care', '🪒', 11, true),
  ('kids', 'Kids', 'Styles for little trendsetters', '🧒', 12, true),
  ('men', 'Men', 'Tailored & everyday menswear', '👔', 13, true),
  ('women', 'Women', 'Curated womenswear', '👠', 14, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

-- Re-map legacy jeans products to fashion
UPDATE products SET category = 'fashion' WHERE category = 'jeans';
UPDATE services SET category = 'fashion' WHERE category = 'jeans';
