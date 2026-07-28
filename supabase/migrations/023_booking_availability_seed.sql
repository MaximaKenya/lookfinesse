-- Seed bookable vendors, services, and availability slots (real UUIDs for booking flow)

DO $$
DECLARE
  v_elitefit uuid := 'a1000000-0000-0000-0000-000000000001';
  v_glow     uuid := 'a1000000-0000-0000-0000-000000000002';
  s_hiit     uuid := 'b1000000-0000-0000-0000-000000000001';
  s_facial   uuid := 'b1000000-0000-0000-0000-000000000002';
BEGIN
  INSERT INTO vendors (id, business_name, name, category, location, is_verified)
  VALUES
    (v_elitefit, 'EliteFit Gym', 'EliteFit Gym', 'fitness', 'Nairobi, Kenya', true),
    (v_glow, 'Glow Salon & Spa', 'Glow Salon', 'beauty', 'Nairobi, Kenya', true)
  ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    location = EXCLUDED.location,
    is_verified = true;

  INSERT INTO services (
    id, vendor_id, title, short_description, description, price, category,
    cover_image, duration_minutes, is_virtual, is_in_person, max_participants, status
  )
  VALUES
    (
      s_hiit,
      v_elitefit,
      'HIIT Bootcamp — 60 mins',
      'High-intensity training for all levels.',
      'Group HIIT session with certified coach. All fitness levels welcome.',
      1500,
      'fitness',
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
      60,
      false,
      true,
      12,
      'active'
    ),
    (
      s_facial,
      v_glow,
      'Signature Facial Treatment',
      'Deep cleanse, exfoliation & hydration.',
      'Relaxing facial with premium skincare products.',
      3500,
      'beauty',
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800',
      75,
      false,
      true,
      4,
      'active'
    )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    short_description = EXCLUDED.short_description,
    price = EXCLUDED.price,
    max_participants = EXCLUDED.max_participants,
    status = 'active';

  INSERT INTO availability_slots (vendor_id, service_id, starts_at, ends_at, is_booked)
  SELECT
    v_elitefit,
    s_hiit,
    ts,
    ts + interval '1 hour',
    false
  FROM generate_series(
    date_trunc('day', now()) + interval '1 day 9 hours',
    date_trunc('day', now()) + interval '6 days 9 hours',
    interval '1 day'
  ) AS ts
  WHERE NOT EXISTS (
    SELECT 1 FROM availability_slots WHERE service_id = s_hiit AND starts_at = ts
  );

  INSERT INTO availability_slots (vendor_id, service_id, starts_at, ends_at, is_booked)
  SELECT
    v_glow,
    s_facial,
    ts,
    ts + interval '75 minutes',
    false
  FROM generate_series(
    date_trunc('day', now()) + interval '1 day 11 hours',
    date_trunc('day', now()) + interval '5 days 11 hours',
    interval '1 day'
  ) AS ts
  WHERE NOT EXISTS (
    SELECT 1 FROM availability_slots WHERE service_id = s_facial AND starts_at = ts
  );
END $$;
