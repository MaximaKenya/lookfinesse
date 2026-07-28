-- Fix booking checkout ("Booking not found") + power the live capacity meter.
--
-- Root cause of "Booking not found": on installs bootstrapped from 020, the
-- bookings table was created WITHOUT foreign keys to vendors/services, so
-- PostgREST embedded selects (services(...), vendors(...)) failed and the
-- booking GET returned an error instead of the row. Add the missing FKs so
-- embeds work, and expose a SECURITY DEFINER capacity function for overbooking
-- protection and the "X of Y spots filled" meter.

-- ── Foreign keys (idempotent) ────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bookings_service_id_fkey' AND table_name = 'bookings'
  ) THEN
    -- Drop orphan references first so the constraint can be added safely.
    UPDATE bookings b
      SET service_id = NULL
      WHERE service_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM services s WHERE s.id = b.service_id);
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_service_id_fkey
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bookings_vendor_id_fkey' AND table_name = 'bookings'
  ) THEN
    DELETE FROM bookings b
      WHERE b.vendor_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM vendors v WHERE v.id = b.vendor_id);
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_vendor_id_fkey
      FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ── Live capacity function ───────────────────────────────────────────────────
-- Aggregate counts only (no row exposure), so it is safe to grant broadly.
CREATE OR REPLACE FUNCTION public.service_slot_capacity(
  p_service_id uuid,
  p_slot_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'service_id', p_service_id,
    'slot_id', p_slot_id,
    'service_max', COALESCE(
      (SELECT max_participants FROM services WHERE id = p_service_id), 0
    ),
    'service_booked', COALESCE(
      (SELECT SUM(participants) FROM bookings
       WHERE service_id = p_service_id
         AND COALESCE(status, '') <> 'cancelled'), 0
    ),
    'slot_max', COALESCE(
      (SELECT max_participants FROM services WHERE id = p_service_id), 0
    ),
    'slot_booked', COALESCE(
      (SELECT SUM(participants) FROM bookings
       WHERE p_slot_id IS NOT NULL
         AND availability_slot_id = p_slot_id
         AND COALESCE(status, '') <> 'cancelled'), 0
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.service_slot_capacity(uuid, uuid) TO anon, authenticated;
