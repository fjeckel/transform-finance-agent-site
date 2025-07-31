-- Add episode summary field for enhanced content structure
-- This allows for concise episode summaries separate from description and full content

ALTER TABLE public.episodes 
ADD COLUMN summary TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.episodes.summary IS 'Concise episode summary (500-2000 chars) for enhanced user experience. Separate from description (short preview) and content (full episode details).';

-- Update existing episodes with placeholder summaries where content exists
-- This ensures existing episodes don't show empty summary sections
UPDATE public.episodes 
SET summary = CASE 
  WHEN content IS NOT NULL AND LENGTH(content) > 100 THEN 
    LEFT(content, 500) || '...'
  WHEN description IS NOT NULL AND LENGTH(description) > 50 THEN 
    description
  ELSE 
    NULL
END
WHERE summary IS NULL;