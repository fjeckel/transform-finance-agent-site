-- Add missing columns for PDF Library management
ALTER TABLE public.downloadable_pdfs 
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived'));

-- Add index for better performance on filtering
CREATE INDEX IF NOT EXISTS idx_downloadable_pdfs_status ON public.downloadable_pdfs(status);
CREATE INDEX IF NOT EXISTS idx_downloadable_pdfs_category ON public.downloadable_pdfs(category);

-- Update existing records to have default values
UPDATE public.downloadable_pdfs 
SET category = 'general', status = 'active' 
WHERE category IS NULL OR status IS NULL;