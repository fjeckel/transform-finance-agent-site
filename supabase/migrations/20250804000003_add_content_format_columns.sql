-- Migration: Add content_format columns to insights and episodes tables
-- This resolves the "Could not find the 'content_format' column" error

-- Add content_format column to insights table
ALTER TABLE public.insights 
ADD COLUMN IF NOT EXISTS content_format VARCHAR(10) DEFAULT 'markdown' 
CHECK (content_format IN ('markdown', 'html'));

-- Add content_format column to episodes table  
ALTER TABLE public.episodes 
ADD COLUMN IF NOT EXISTS content_format VARCHAR(10) DEFAULT 'markdown'
CHECK (content_format IN ('markdown', 'html'));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_insights_content_format ON public.insights(content_format);
CREATE INDEX IF NOT EXISTS idx_episodes_content_format ON public.episodes(content_format);

-- Set default values for existing records
UPDATE public.insights 
SET content_format = 'markdown' 
WHERE content_format IS NULL;

UPDATE public.episodes 
SET content_format = 'markdown' 
WHERE content_format IS NULL;

-- Verify the migration
SELECT 
  'insights' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN content_format = 'markdown' THEN 1 END) as markdown_count,
  COUNT(CASE WHEN content_format = 'html' THEN 1 END) as html_count
FROM public.insights
UNION ALL
SELECT 
  'episodes' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN content_format = 'markdown' THEN 1 END) as markdown_count,
  COUNT(CASE WHEN content_format = 'html' THEN 1 END) as html_count
FROM public.episodes;