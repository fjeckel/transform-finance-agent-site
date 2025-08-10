-- Create YouTube videos table for caching WTF channel content
CREATE TABLE youtube_videos (
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
CREATE INDEX idx_youtube_videos_published_at ON youtube_videos(published_at DESC);
CREATE INDEX idx_youtube_videos_is_short ON youtube_videos(is_short);
CREATE INDEX idx_youtube_videos_channel_id ON youtube_videos(channel_id);

-- Enable RLS
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;

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
CREATE TRIGGER update_youtube_videos_updated_at_trigger
  BEFORE UPDATE ON youtube_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_youtube_videos_updated_at();

-- Add comment for documentation
COMMENT ON TABLE youtube_videos IS 'Cached YouTube videos from WTF Finance Transformers channel';