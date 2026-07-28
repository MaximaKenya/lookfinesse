-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 019: profile-media storage bucket (bucket record only)
--
-- Supabase hosted projects cannot ALTER storage.objects or create storage
-- policies via SQL Editor without superuser ("must be owner of table objects").
--
-- This migration ONLY upserts the bucket row when INSERT is permitted.
-- Create RLS policies manually in Dashboard → Storage → Policies.
-- See docs/STORAGE_SETUP.md and /help/storage for copy-paste policy SQL.
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-media',
  'profile-media',
  true,
  52428800,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
