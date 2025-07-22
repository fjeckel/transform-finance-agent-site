
-- Create storage bucket for main page videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'main-page-videos',
  'main-page-videos', 
  true,
  52428800, -- 50MB in bytes
  ARRAY['video/mp4', 'video/webm', 'video/mov']
);

-- Create storage policies for the main-page-videos bucket
CREATE POLICY "Admins can upload main page videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'main-page-videos' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update main page videos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'main-page-videos' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete main page videos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'main-page-videos' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Anyone can view main page videos" ON storage.objects
FOR SELECT USING (bucket_id = 'main-page-videos');

-- Add site settings for hero video management
INSERT INTO public.site_settings (setting_name, setting_value) 
VALUES 
  ('hero_video_url', ''),
  ('hero_video_type', 'youtube'),
  ('hero_youtube_url', 'https://www.youtube.com/embed/nBQKMPWrUgc?autoplay=1&mute=1&loop=1&playlist=nBQKMPWrUgc&controls=0&showinfo=0&modestbranding=1&enablejsapi=1')
ON CONFLICT (setting_name) DO NOTHING;
