-- RLS POLICY VERIFICATION SCRIPT
-- Run this after applying the consolidated RLS migration
-- Admin email: fjeckel@me.com

-- ========================================
-- 1. CHECK CURRENT RLS STATUS
-- ========================================

SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policy WHERE polrelid = c.oid) as policy_count
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
AND c.relname IN ('insights', 'insights_categories', 'analytics_events')
AND c.relkind = 'r';

-- ========================================
-- 2. LIST ALL POLICIES FOR KEY TABLES
-- ========================================

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
WHERE schemaname = 'public' 
AND tablename IN ('insights', 'insights_categories', 'analytics_events')
ORDER BY tablename, policyname;

-- ========================================
-- 3. TEST PUBLIC ACCESS (should work without auth)
-- ========================================

-- Test: Public can read published insights
SELECT 'PUBLIC INSIGHTS TEST' as test_name, count(*) as published_insights 
FROM public.insights 
WHERE status = 'published';

-- Test: Public can read categories
SELECT 'PUBLIC CATEGORIES TEST' as test_name, count(*) as total_categories 
FROM public.insights_categories;

-- ========================================
-- 4. CHECK FOR DUPLICATE POLICIES
-- ========================================

SELECT 
    tablename,
    count(*) as policy_count,
    string_agg(policyname, ', ') as policy_names
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('insights', 'insights_categories', 'analytics_events')
GROUP BY tablename;

-- ========================================
-- 5. ADMIN EMAIL VERIFICATION
-- ========================================

-- Check what admin emails are configured in policies
SELECT 
    tablename,
    policyname,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND qual LIKE '%@%'
ORDER BY tablename, policyname;

-- ========================================
-- 6. EXPECTED RESULTS
-- ========================================

/*
EXPECTED POLICY STRUCTURE:

insights table:
- insights_public_read (SELECT, no auth needed)
- insights_admin_access (ALL, fjeckel@me.com only)  
- insights_user_manage_own (ALL, own records only)

insights_categories:
- categories_read_all (SELECT, no auth needed)
- categories_admin_manage (ALL, fjeckel@me.com only)

analytics_events:
- analytics_insert_anyone (INSERT, no auth needed)
- analytics_admin_read (SELECT, fjeckel@me.com only)

All should use email: fjeckel@me.com
No duplicate or conflicting policies
*/