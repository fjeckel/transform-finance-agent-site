-- Fix RLS policies for insights table to allow authenticated users to create insights

-- Drop the existing broad policy that doesn't work for INSERTs
DROP POLICY IF EXISTS "Authors can manage their insights" ON public.insights;

-- Create separate policies for different operations
-- Authors can insert new insights (any authenticated user)
CREATE POLICY "Authenticated users can create insights" ON public.insights
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

-- Authors can read their own insights (including drafts)
CREATE POLICY "Authors can read their own insights" ON public.insights
  FOR SELECT 
  USING (auth.uid() = created_by);

-- Authors can update their own insights
CREATE POLICY "Authors can update their own insights" ON public.insights
  FOR UPDATE 
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Authors can delete their own insights
CREATE POLICY "Authors can delete their own insights" ON public.insights
  FOR DELETE 
  USING (auth.uid() = created_by);

-- Admin policy (if you have admin users defined by email)
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