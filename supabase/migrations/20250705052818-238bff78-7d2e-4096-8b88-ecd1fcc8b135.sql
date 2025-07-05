-- Add podcast series types to episodes table
CREATE TYPE podcast_series AS ENUM ('wtf', 'finance_transformers', 'cfo_memo');

-- Add series column to episodes table
ALTER TABLE public.episodes 
ADD COLUMN series podcast_series DEFAULT 'wtf';

-- Add index for better performance when filtering by series
CREATE INDEX idx_episodes_series ON public.episodes(series);

-- Add index for published episodes by series
CREATE INDEX idx_episodes_series_status ON public.episodes(series, status);

-- Update existing episodes to be WTF series
UPDATE public.episodes SET series = 'wtf' WHERE series IS NULL;