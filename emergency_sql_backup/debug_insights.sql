-- Debug insights loading issues

-- 1. Check if insights table exists and has data
SELECT COUNT(*) as total_insights FROM public.insights;

-- 2. Check current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'insights';

-- 3. Check if there are any insights at all
SELECT id, title, status, created_by, created_at FROM public.insights LIMIT 5;

-- 4. Test if we can insert a simple insight (run as authenticated user)
-- This will fail if RLS is blocking INSERTs
/*
INSERT INTO public.insights (
    title,
    slug,
    content,
    insight_type,
    status,
    created_by
) VALUES (
    'Test Insight',
    'test-insight-' || extract(epoch from now()),
    'This is a test insight content.',
    'blog_article',
    'draft',
    auth.uid()
);
*/

-- 5. Check if insights_categories table has data
SELECT COUNT(*) as total_categories FROM public.insights_categories;
SELECT name, slug FROM public.insights_categories LIMIT 5;

-- 6. Temporary fix: Disable RLS to test if that's the issue
-- ALTER TABLE public.insights DISABLE ROW LEVEL SECURITY;
-- After testing, remember to re-enable: ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;