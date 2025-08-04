-- MANUAL DATABASE MIGRATION INSTRUCTIONS
-- Copy and paste this SQL into your Supabase Dashboard > SQL Editor
-- This will resolve the "Could not find the 'content_format' column" errors

-- ========================================
-- STEP 1: Add content_format columns
-- ========================================

-- Add content_format column to insights table
ALTER TABLE public.insights 
ADD COLUMN IF NOT EXISTS content_format VARCHAR(10) DEFAULT 'markdown' 
CHECK (content_format IN ('markdown', 'html'));

-- Add content_format column to episodes table  
ALTER TABLE public.episodes 
ADD COLUMN IF NOT EXISTS content_format VARCHAR(10) DEFAULT 'markdown'
CHECK (content_format IN ('markdown', 'html'));

-- ========================================
-- STEP 2: Create performance indexes
-- ========================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_insights_content_format ON public.insights(content_format);
CREATE INDEX IF NOT EXISTS idx_episodes_content_format ON public.episodes(content_format);

-- ========================================
-- STEP 3: Set default values for existing records
-- ========================================

-- Set default values for existing records
UPDATE public.insights 
SET content_format = 'markdown' 
WHERE content_format IS NULL;

UPDATE public.episodes 
SET content_format = 'markdown' 
WHERE content_format IS NULL;

-- ========================================
-- STEP 4: Verification query (optional)
-- ========================================

-- Run this to verify the migration worked
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

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
-- After running this SQL:
-- 1. Your insights creation will work without "content_format column not found" errors
-- 2. Rich text editor functionality will be fully supported
-- 3. Both markdown and HTML content formats are properly tracked
-- 4. Performance is optimized with proper indexes