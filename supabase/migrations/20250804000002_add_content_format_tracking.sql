-- Add content format tracking for rich text editor migration
-- This migration adds content_format columns to track how content is stored

-- Add content format tracking to insights table
ALTER TABLE public.insights 
ADD COLUMN content_format TEXT DEFAULT 'markdown' 
CHECK (content_format IN ('markdown', 'html', 'hybrid'));

-- Add content format tracking to episodes table  
ALTER TABLE public.episodes
ADD COLUMN content_format TEXT DEFAULT 'plain' 
CHECK (content_format IN ('plain', 'html', 'hybrid'));

-- Create indexes for efficient querying by content format
CREATE INDEX idx_insights_content_format ON public.insights(content_format);
CREATE INDEX idx_episodes_content_format ON public.episodes(content_format);

-- Add helpful comments
COMMENT ON COLUMN public.insights.content_format IS 'Format of the content field: markdown (legacy), html (rich text), hybrid (supports both)';
COMMENT ON COLUMN public.episodes.content_format IS 'Format of the content field: plain (legacy), html (rich text), hybrid (supports both)';

-- Update existing records to reflect their current format
-- Insights are currently using markdown
UPDATE public.insights SET content_format = 'markdown' WHERE content_format IS NULL;

-- Episodes are currently using plain text
UPDATE public.episodes SET content_format = 'plain' WHERE content_format IS NULL;