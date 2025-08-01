-- Add summary column to episodes table for enhanced content structure
ALTER TABLE public.episodes 
ADD COLUMN summary TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.episodes.summary IS 'Concise episode summary (500-2000 characters) highlighting key takeaways for listeners';