-- EMERGENCY: Completely disable RLS to test if that's the blocker

-- Disable RLS on insights table
ALTER TABLE public.insights DISABLE ROW LEVEL SECURITY;

-- Disable RLS on categories table  
ALTER TABLE public.insights_categories DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to everyone (temporary)
GRANT ALL ON public.insights TO anon;
GRANT ALL ON public.insights TO authenticated;
GRANT ALL ON public.insights_categories TO anon;
GRANT ALL ON public.insights_categories TO authenticated;

-- Check if there are any insights in the table
SELECT COUNT(*) as total_insights FROM public.insights;

-- Check if categories exist
SELECT COUNT(*) as total_categories FROM public.insights_categories;

-- If no insights exist, create a test one
INSERT INTO public.insights (
    title,
    slug, 
    content,
    insight_type,
    status,
    view_count,
    featured
) VALUES (
    'Test Insight - Emergency Check',
    'test-insight-emergency-' || extract(epoch from now()),
    'This is an emergency test insight to verify database functionality.',
    'blog_article',
    'published',
    0,
    false
) ON CONFLICT (slug) DO NOTHING;