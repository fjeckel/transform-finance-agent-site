-- TEST QUERIES FOR DATABASE MIGRATION
-- Run these in Supabase Dashboard > SQL Editor to test the migration

-- ========================================
-- TEST 1: Verify columns exist
-- ========================================
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name IN ('insights', 'episodes') 
AND column_name = 'content_format'
ORDER BY table_name;

-- ========================================
-- TEST 2: Check current data distribution
-- ========================================
SELECT 
  'insights' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN content_format = 'markdown' THEN 1 END) as markdown_count,
  COUNT(CASE WHEN content_format = 'html' THEN 1 END) as html_count,
  COUNT(CASE WHEN content_format IS NULL THEN 1 END) as null_count
FROM public.insights
UNION ALL
SELECT 
  'episodes' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN content_format = 'markdown' THEN 1 END) as markdown_count,
  COUNT(CASE WHEN content_format = 'html' THEN 1 END) as html_count,
  COUNT(CASE WHEN content_format IS NULL THEN 1 END) as null_count
FROM public.episodes;

-- ========================================
-- TEST 3: Test INSERT operations (simulate app behavior)
-- ========================================
-- Test inserting insight with content_format
INSERT INTO public.insights (
    title, 
    slug,
    content, 
    content_format,
    created_by
) VALUES (
    'Test Insight - HTML Format',
    'test-insight-html-format',
    '<p><strong>This is a test</strong> with HTML content</p>',
    'html',
    (SELECT id FROM public.profiles LIMIT 1)
) RETURNING id, title, content_format;

-- Test inserting insight without content_format (should default to markdown)
INSERT INTO public.insights (
    title, 
    slug,
    content,
    created_by
) VALUES (
    'Test Insight - Default Format',
    'test-insight-default-format',
    '**This is a test** with markdown content',
    (SELECT id FROM public.profiles LIMIT 1)
) RETURNING id, title, content_format;

-- ========================================
-- TEST 4: Test constraint validation
-- ========================================
-- This should FAIL (invalid content_format value)
-- INSERT INTO public.insights (title, content, content_format, user_id) 
-- VALUES ('Test', 'content', 'invalid_format', (SELECT id FROM auth.users LIMIT 1));

-- ========================================
-- TEST 5: Clean up test data
-- ========================================
-- Remove test records
DELETE FROM public.insights 
WHERE title IN ('Test Insight - HTML Format', 'Test Insight - Default Format');

-- ========================================
-- TEST 6: Verify indexes exist
-- ========================================
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE indexname IN ('idx_insights_content_format', 'idx_episodes_content_format')
ORDER BY tablename, indexname;