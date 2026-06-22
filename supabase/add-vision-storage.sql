-- ==========================================================
-- SQL Script: Create public storage bucket 'chat-uploads'
-- and configure Row Level Security (RLS) policies.
-- ==========================================================

-- 1. Create a public bucket 'chat-uploads' in storage.buckets if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-uploads', 'chat-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Ensure Row Level Security (RLS) is enabled on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow authenticated users to upload (INSERT) files
-- under a folder path starting with their own user ID (auth.uid()).
CREATE POLICY "Allow authenticated inserts into user folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-uploads' AND
  (split_part(name, '/', 1) = auth.uid()::text)
);

-- 4. Policy: Allow anyone (public) to view/download (SELECT) files.
-- This is necessary to render uploaded image URLs directly inside chat bubbles.
CREATE POLICY "Allow public select for chat-uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-uploads');
