-- CONSOLIDATED RLS POLICY FIX
-- Fixes all email inconsistencies and conflicting policies
-- Admin email: fjeckel@me.com

-- ========================================
-- 1. INSIGHTS TABLE - Clean slate approach
-- ========================================

-- Drop ALL existing insights policies to avoid conflicts
DROP POLICY IF EXISTS "public_read_published" ON public.insights;
DROP POLICY IF EXISTS "admin_full_access" ON public.insights;
DROP POLICY IF EXISTS "auth_users_create" ON public.insights;
DROP POLICY IF EXISTS "auth_users_read_own" ON public.insights;
DROP POLICY IF EXISTS "auth_users_update_own" ON public.insights;
DROP POLICY IF EXISTS "auth_users_delete_own" ON public.insights;
DROP POLICY IF EXISTS "authenticated_users_access" ON public.insights;
DROP POLICY IF EXISTS "Public can read published insights" ON public.insights;
DROP POLICY IF EXISTS "Authors can manage their insights" ON public.insights;
DROP POLICY IF EXISTS "Authors can read their own insights" ON public.insights;
DROP POLICY IF EXISTS "Authors can update their own insights" ON public.insights;
DROP POLICY IF EXISTS "Authors can delete their own insights" ON public.insights;
DROP POLICY IF EXISTS "Authenticated users can create insights" ON public.insights;
DROP POLICY IF EXISTS "Admins can manage all insights" ON public.insights;
DROP POLICY IF EXISTS "Anyone can read published insights" ON public.insights;
DROP POLICY IF EXISTS "Authenticated users full access" ON public.insights;

-- Create simplified, non-conflicting policies for insights
-- 1. Public read access to published insights (no auth needed)
CREATE POLICY "insights_public_read" ON public.insights
    FOR SELECT 
    USING (status = 'published');

-- 2. Admin full access (using correct email: fjeckel@me.com)
CREATE POLICY "insights_admin_access" ON public.insights
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'fjeckel@me.com'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'fjeckel@me.com'
        )
    );

-- 3. Authenticated users can manage their own insights
CREATE POLICY "insights_user_manage_own" ON public.insights
    FOR ALL
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- ========================================
-- 2. INSIGHTS_CATEGORIES TABLE - Clean slate
-- ========================================

-- Drop existing category policies
DROP POLICY IF EXISTS "categories_public_read" ON public.insights_categories;
DROP POLICY IF EXISTS "categories_auth_manage" ON public.insights_categories;
DROP POLICY IF EXISTS "Public can read categories" ON public.insights_categories;
DROP POLICY IF EXISTS "Anyone can read categories" ON public.insights_categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.insights_categories;

-- Create simplified category policies
-- 1. Everyone can read categories
CREATE POLICY "categories_read_all" ON public.insights_categories
    FOR SELECT 
    USING (true);

-- 2. Admin can manage categories
CREATE POLICY "categories_admin_manage" ON public.insights_categories
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'fjeckel@me.com'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'fjeckel@me.com'
        )
    );

-- ========================================
-- 3. ANALYTICS_EVENTS TABLE - Fix email
-- ========================================

-- Drop existing analytics policies with wrong emails
DROP POLICY IF EXISTS "analytics_insert_all" ON analytics_events;
DROP POLICY IF EXISTS "analytics_admin_read" ON analytics_events;
DROP POLICY IF EXISTS "analytics_insert_all" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_admin_read" ON public.analytics_events;

-- Create analytics policies with correct admin email
CREATE POLICY "analytics_insert_anyone" ON analytics_events
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "analytics_admin_read" ON analytics_events
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'fjeckel@me.com'
        )
    );

-- ========================================
-- 4. ENSURE RLS IS PROPERLY ENABLED
-- ========================================

ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. GRANT NECESSARY PERMISSIONS
-- ========================================

GRANT SELECT ON public.insights TO anon;
GRANT SELECT ON public.insights_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insights_categories TO authenticated;
GRANT SELECT, INSERT ON analytics_events TO authenticated;
GRANT INSERT ON analytics_events TO anon;

-- ========================================
-- 6. VERIFICATION QUERIES (commented out)
-- ========================================

-- Test queries to verify policies work:
-- SELECT count(*) FROM public.insights WHERE status = 'published'; -- Should work for anon
-- SELECT count(*) FROM public.insights_categories; -- Should work for anon
-- SELECT auth.uid(), auth.jwt() -> 'email'; -- Check current user
