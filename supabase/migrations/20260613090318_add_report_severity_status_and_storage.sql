-- Add severity and status columns to reports
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS severity text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Create storage bucket for report images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-images',
  'report-images',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to report-images
CREATE POLICY "report_images_insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'report-images');

-- Allow public read of report images
CREATE POLICY "report_images_select"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'report-images');
