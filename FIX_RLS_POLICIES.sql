-- FIX RLS POLICIES: The table exists but policies might be missing/wrong
-- Run this in Supabase SQL Editor to fix the 406 error

-- Check current policies
SELECT 
    tablename,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'purchases';

-- Drop existing policies if they exist (to recreate them properly)
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.purchases;

-- Ensure RLS is enabled
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create the correct policies
CREATE POLICY "Users can view their own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON public.purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT ON public.purchases TO authenticated;

-- Test query that was failing
SELECT 'Testing the exact query that was failing...' as test;

-- This should work now without 406 error
SELECT COUNT(*) as test_count 
FROM public.purchases 
WHERE user_id = auth.uid() 
    AND pdf_id = 'bfd32bd6-1931-42d9-9b60-bad684e07df4' 
    AND status = 'completed';

SELECT 'RLS POLICIES FIXED - 406 error should be resolved!' as result;