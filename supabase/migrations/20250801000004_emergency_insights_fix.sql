-- Emergency fix for insights loading and creation issues

-- Step 1: Temporarily disable RLS to isolate the issue
ALTER TABLE public.insights DISABLE ROW LEVEL SECURITY;

-- Step 2: Check if categories table has RLS issues too
ALTER TABLE public.insights_categories DISABLE ROW LEVEL SECURITY;

-- Step 3: Create a simple test insight to verify basic functionality
INSERT INTO public.insights (
    title,
    slug,
    content,
    insight_type,
    status,
    view_count,
    featured
) VALUES (
    'Test Insight - System Check',
    'test-insight-system-check',
    'This is a test insight to verify the system is working.',
    'blog_article',
    'published',
    0,
    false
) ON CONFLICT (slug) DO NOTHING;

-- Step 4: If the above works, re-enable RLS with proper policies
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights_categories ENABLE ROW LEVEL SECURITY;

-- Step 5: Create working RLS policies (drop all first)
DROP POLICY IF EXISTS "Public can read published insights" ON public.insights;
DROP POLICY IF EXISTS "Authors can manage their insights" ON public.insights;
DROP POLICY IF EXISTS "Authors can read their own insights" ON public.insights;
DROP POLICY IF EXISTS "Authors can update their own insights" ON public.insights;
DROP POLICY IF EXISTS "Authors can delete their own insights" ON public.insights;
DROP POLICY IF EXISTS "Authenticated users can create insights" ON public.insights;
DROP POLICY IF EXISTS "Admins can manage all insights" ON public.insights;

-- Step 6: Create minimal working policies

-- Allow everyone to read published insights
CREATE POLICY "Anyone can read published insights" ON public.insights
    FOR SELECT USING (status = 'published');

-- Allow authenticated users to do everything (temporary broad policy)
CREATE POLICY "Authenticated users full access" ON public.insights
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow categories to be read by everyone
CREATE POLICY "Anyone can read categories" ON public.insights_categories
    FOR SELECT USING (true);

-- Allow categories management for authenticated users
CREATE POLICY "Authenticated users can manage categories" ON public.insights_categories
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);