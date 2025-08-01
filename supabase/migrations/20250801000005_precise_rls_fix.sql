-- PRECISE RLS FIX - Target the exact access denied issues

-- Step 1: Check what user is trying to access (for debugging)
-- Run this to see current user: SELECT auth.uid(), auth.jwt();

-- Step 2: Drop ALL existing policies to start completely clean
DROP POLICY IF EXISTS "Public can read published insights" ON public.insights;
DROP POLICY IF EXISTS "Authors can manage their insights" ON public.insights;
DROP POLICY IF EXISTS "Authors can read their own insights" ON public.insights;
DROP POLICY IF EXISTS "Authors can update their own insights" ON public.insights;
DROP POLICY IF EXISTS "Authors can delete their own insights" ON public.insights;
DROP POLICY IF EXISTS "Authenticated users can create insights" ON public.insights;
DROP POLICY IF EXISTS "Admins can manage all insights" ON public.insights;
DROP POLICY IF EXISTS "Anyone can read published insights" ON public.insights;
DROP POLICY IF EXISTS "Authenticated users full access" ON public.insights;

-- Categories policies
DROP POLICY IF EXISTS "Public can read categories" ON public.insights_categories;
DROP POLICY IF EXISTS "Anyone can read categories" ON public.insights_categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.insights_categories;

-- Step 3: Create MINIMAL, WORKING policies

-- 1. PUBLIC ACCESS: Anyone can read published insights (no auth required)
CREATE POLICY "public_read_published" ON public.insights
    FOR SELECT 
    USING (status = 'published');

-- 2. ADMIN ACCESS: Full access for specific admin emails
CREATE POLICY "admin_full_access" ON public.insights
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'fabianjeckel@outlook.com'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'fabianjeckel@outlook.com'
        )
    );

-- 3. AUTHENTICATED USER ACCESS: Can create and manage their own insights
-- CREATE: Any authenticated user can create (no ownership check needed on insert)
CREATE POLICY "auth_users_create" ON public.insights
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- SELECT: Users can read their own insights (including drafts)
CREATE POLICY "auth_users_read_own" ON public.insights
    FOR SELECT 
    TO authenticated
    USING (created_by = auth.uid());

-- UPDATE: Users can update their own insights
CREATE POLICY "auth_users_update_own" ON public.insights
    FOR UPDATE 
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- DELETE: Users can delete their own insights
CREATE POLICY "auth_users_delete_own" ON public.insights
    FOR DELETE 
    TO authenticated
    USING (created_by = auth.uid());

-- Step 4: Categories policies (simple and permissive)
CREATE POLICY "categories_public_read" ON public.insights_categories
    FOR SELECT 
    USING (true);

CREATE POLICY "categories_auth_manage" ON public.insights_categories
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Step 5: Grant explicit permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insights_categories TO authenticated;

-- Step 6: Ensure the tables have RLS enabled
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights_categories ENABLE ROW LEVEL SECURITY;