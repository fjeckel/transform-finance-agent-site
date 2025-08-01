-- Check and fix insights RLS policies safely

-- First, let's see what policies exist
-- Run this query to check current policies:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'insights';

-- Drop all existing policies to start fresh (use IF EXISTS to avoid errors)
DROP POLICY IF EXISTS "Public can read published insights" ON public.insights;
DROP POLICY IF EXISTS "Authors can manage their insights" ON public.insights;
DROP POLICY IF EXISTS "Authors can read their own insights" ON public.insights;
DROP POLICY IF EXISTS "Authors can update their own insights" ON public.insights;
DROP POLICY IF EXISTS "Authors can delete their own insights" ON public.insights;
DROP POLICY IF EXISTS "Authenticated users can create insights" ON public.insights;
DROP POLICY IF EXISTS "Admins can manage all insights" ON public.insights;

-- Now create clean, working policies

-- 1. Public can read published insights
CREATE POLICY "Public can read published insights" ON public.insights
  FOR SELECT USING (status = 'published');

-- 2. Authenticated users can create insights
CREATE POLICY "Authenticated users can create insights" ON public.insights
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Authors can read their own insights (including drafts)
CREATE POLICY "Authors can read their own insights" ON public.insights
  FOR SELECT 
  USING (auth.uid() = created_by);

-- 4. Authors can update their own insights
CREATE POLICY "Authors can update their own insights" ON public.insights
  FOR UPDATE 
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- 5. Authors can delete their own insights
CREATE POLICY "Authors can delete their own insights" ON public.insights
  FOR DELETE 
  USING (auth.uid() = created_by);

-- 6. Admin policy for full access
CREATE POLICY "Admins can manage all insights" ON public.insights
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('fabianjeckel@outlook.com', 'admin@financetransformers.com')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('fabianjeckel@outlook.com', 'admin@financetransformers.com')
    )
  );