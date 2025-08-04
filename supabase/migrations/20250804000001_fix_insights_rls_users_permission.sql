-- Fix RLS permission denied for table users when creating insights
-- This migration fixes the issue where authenticated users cannot create insights
-- because they don't have permission to read from auth.users table

-- Drop existing policies that check auth.users table
DROP POLICY IF EXISTS "insights_admin_access" ON public.insights;
DROP POLICY IF EXISTS "insights_user_manage_own" ON public.insights;

-- Recreate admin policy using auth.uid() and auth.jwt() instead of querying auth.users
CREATE POLICY "insights_admin_access" ON public.insights
    FOR ALL
    TO authenticated
    USING (
        auth.jwt() ->> 'email' = 'fjeckel@me.com'
    )
    WITH CHECK (
        auth.jwt() ->> 'email' = 'fjeckel@me.com'
    );

-- Recreate user policy for managing own insights
CREATE POLICY "insights_user_manage_own" ON public.insights
    FOR ALL
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Also fix the categories admin policy
DROP POLICY IF EXISTS "categories_admin_manage" ON public.insights_categories;

CREATE POLICY "categories_admin_manage" ON public.insights_categories
    FOR ALL
    TO authenticated
    USING (
        auth.jwt() ->> 'email' = 'fjeckel@me.com'
    )
    WITH CHECK (
        auth.jwt() ->> 'email' = 'fjeckel@me.com'
    );

-- Fix analytics_events admin read policy
DROP POLICY IF EXISTS "analytics_admin_read" ON analytics_events;

CREATE POLICY "analytics_admin_read" ON analytics_events
    FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'email' = 'fjeckel@me.com'
    );

-- Verify the policies are correctly set
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('insights', 'insights_categories', 'analytics_events')
ORDER BY tablename, policyname;