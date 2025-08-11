-- Execute this SQL in the Supabase Dashboard SQL Editor
-- Go to: https://supabase.com/dashboard/project/aumijfxmeclxweojrefa/sql

-- Create YouTube videos table for caching WTF channel content
CREATE TABLE IF NOT EXISTS youtube_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  view_count BIGINT DEFAULT 0,
  like_count BIGINT DEFAULT 0,
  published_at TIMESTAMPTZ NOT NULL,
  channel_id TEXT NOT NULL DEFAULT 'UC2sXuBElJDyzxKv3J8kmyng',
  is_short BOOLEAN DEFAULT false,
  tags TEXT[],
  category_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_youtube_videos_published_at ON youtube_videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_is_short ON youtube_videos(is_short);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_channel_id ON youtube_videos(channel_id);

-- Enable RLS
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view YouTube videos" ON youtube_videos;
DROP POLICY IF EXISTS "Admins can manage YouTube videos" ON youtube_videos;

-- Allow public read access to published videos
CREATE POLICY "Public can view YouTube videos" ON youtube_videos
  FOR SELECT
  USING (true);

-- Admin can manage all videos
CREATE POLICY "Admins can manage YouTube videos" ON youtube_videos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = auth.users.id 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_youtube_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_youtube_videos_updated_at_trigger ON youtube_videos;
CREATE TRIGGER update_youtube_videos_updated_at_trigger
  BEFORE UPDATE ON youtube_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_youtube_videos_updated_at();

-- Add comment for documentation
COMMENT ON TABLE youtube_videos IS 'Cached YouTube videos from WTF Finance Transformers channel';

-- Populate with some test data to verify it's working
INSERT INTO youtube_videos (
  video_id, title, description, thumbnail_url, duration, 
  view_count, published_at, is_short
) VALUES 
(
  'nBQKMPWrUgc',
  'CFO Transformation in 60 Sekunden',
  'Quick insights for finance transformation',
  'https://img.youtube.com/vi/nBQKMPWrUgc/maxresdefault.jpg',
  '0:58',
  1200,
  NOW() - INTERVAL '2 days',
  true
),
(
  'dQw4w9WgXcQ', 
  'KI im Controlling - Game Changer?',
  'AI in financial controlling discussion',
  'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  '0:45',
  892,
  NOW() - INTERVAL '5 days',
  true
),
(
  'jNQXAC9IVRw',
  'Excel vs. Modern FP&A Tools',
  'Comparing traditional and modern finance tools',
  'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
  '1:00',
  2100,
  NOW() - INTERVAL '1 week',
  true
)
ON CONFLICT (video_id) DO NOTHING;

SELECT 'YouTube videos table setup complete! Found ' || COUNT(*) || ' videos.' as result
FROM youtube_videos;