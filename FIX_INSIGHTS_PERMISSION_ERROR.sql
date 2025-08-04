-- IMMEDIATE FIX FOR "permission denied for table users" ERROR
-- Apply this directly in Supabase SQL Editor to fix the insights creation issue

BEGIN;

-- Drop the problematic policies that query auth.users table
DROP POLICY IF EXISTS "insights_admin_access" ON public.insights;
DROP POLICY IF EXISTS "insights_user_manage_own" ON public.insights;
DROP POLICY IF EXISTS "categories_admin_manage" ON public.insights_categories;
DROP POLICY IF EXISTS "analytics_admin_read" ON analytics_events;

-- Recreate policies using auth.jwt() which doesn't require reading auth.users table

-- 1. Admin access for insights (using JWT email claim)
CREATE POLICY "insights_admin_access" ON public.insights
    FOR ALL
    TO authenticated
    USING (
        auth.jwt() ->> 'email' = 'fjeckel@me.com'
    )
    WITH CHECK (
        auth.jwt() ->> 'email' = 'fjeckel@me.com'
    );

-- 2. Users can manage their own insights
CREATE POLICY "insights_user_manage_own" ON public.insights
    FOR ALL
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- 3. Admin access for categories
CREATE POLICY "categories_admin_manage" ON public.insights_categories
    FOR ALL
    TO authenticated
    USING (
        auth.jwt() ->> 'email' = 'fjeckel@me.com'
    )
    WITH CHECK (
        auth.jwt() ->> 'email' = 'fjeckel@me.com'
    );

-- 4. Admin read access for analytics
CREATE POLICY "analytics_admin_read" ON analytics_events
    FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'email' = 'fjeckel@me.com'
    );

COMMIT;

-- Verify the fix
SELECT 
    'Policies updated successfully!' as status,
    count(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('insights', 'insights_categories', 'analytics_events');