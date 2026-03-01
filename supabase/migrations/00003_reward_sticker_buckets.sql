-- ============================================================
-- Migration: 00002_storage_buckets
-- Purpose: Create storage buckets and access policies
-- ============================================================

-- Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('rewards', 'rewards', true, NULL, NULL),
  ('stickers', 'stickers', true, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone (including unauthenticated) to read stickers
CREATE POLICY "Public stickers read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'stickers');

-- Allow authenticated users to upload to stickers bucket
CREATE POLICY "Admin stickers upload"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'stickers'
    AND auth.role() = 'authenticated'
  );
