-- SIMPLE RLS POLICY TEST
-- Run this AFTER applying APPLY_RLS_FIX_DIRECTLY.sql

-- 1. Check RLS status on key tables
SELECT 
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policy WHERE polrelid = c.oid) as policy_count
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
AND c.relname IN ('insights', 'insights_categories', 'analytics_events')
AND c.relkind = 'r'
ORDER BY c.relname;

-- 2. List all current policies (should be clean)
SELECT 
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual LIKE '%fjeckel@me.com%' THEN '✓ Correct Admin Email'
        WHEN qual LIKE '%@%' AND qual NOT LIKE '%fjeckel@me.com%' THEN '❌ Wrong Email'
        ELSE 'No Email Check'
    END as email_status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('insights', 'insights_categories', 'analytics_events')
ORDER BY tablename, policyname;

-- 3. Test public access (should work without authentication)
SELECT 'Testing public access...' as test;
SELECT count(*) as published_insights FROM public.insights WHERE status = 'published';
SELECT count(*) as total_categories FROM public.insights_categories;

-- Expected Results:
-- - 3 policies on insights table
-- - 2 policies on insights_categories table  
-- - 2 policies on analytics_events table
-- - All admin policies should show "✓ Correct Admin Email"
-- - Public queries should return counts without errors