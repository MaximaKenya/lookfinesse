-- Bookings table (referenced by 006 RLS policies but never created in earlier migrations)
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  user_id uuid NOT NULL,
  service_id uuid,
  staff_member_id uuid REFERENCES staff_members(id) ON DELETE SET NULL,
  availability_slot_id uuid REFERENCES availability_slots(id) ON DELETE SET NULL,
  booking_type text,
  participants integer NOT NULL DEFAULT 1 CHECK (participants >= 1),
  notes text,
  total_amount numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor ON bookings(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(availability_slot_id);

-- Ensure columns exist on legacy partial installs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'availability_slot_id') THEN
    ALTER TABLE bookings ADD COLUMN availability_slot_id uuid REFERENCES availability_slots(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'staff_member_id') THEN
    ALTER TABLE bookings ADD COLUMN staff_member_id uuid REFERENCES staff_members(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'booking_type') THEN
    ALTER TABLE bookings ADD COLUMN booking_type text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'participants') THEN
    ALTER TABLE bookings ADD COLUMN participants integer NOT NULL DEFAULT 1;
  END IF;
END $$;
