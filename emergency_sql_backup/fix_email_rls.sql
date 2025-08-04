-- FIX: Update RLS policies with correct email address

-- Drop existing policies with wrong email
DROP POLICY IF EXISTS "public_read_published" ON public.insights;
DROP POLICY IF EXISTS "admin_full_access" ON public.insights;
DROP POLICY IF EXISTS "auth_users_create" ON public.insights;
DROP POLICY IF EXISTS "auth_users_read_own" ON public.insights;
DROP POLICY IF EXISTS "auth_users_update_own" ON public.insights;
DROP POLICY IF EXISTS "auth_users_delete_own" ON public.insights;

-- Create policies with CORRECT email address
CREATE POLICY "admin_full_access" ON public.insights
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

-- Also create a fallback policy for any authenticated user
CREATE POLICY "authenticated_users_access" ON public.insights
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT ALL ON public.insights TO authenticated;
GRANT ALL ON public.insights_categories TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights_categories ENABLE ROW LEVEL SECURITY;