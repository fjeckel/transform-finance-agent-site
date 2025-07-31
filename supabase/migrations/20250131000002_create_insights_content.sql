-- Create insights content structure for book summaries and blog articles
-- This enables the new Insights tab with rich, educational content

-- Create insights content type enum
CREATE TYPE public.insight_type AS ENUM ('book_summary', 'blog_article', 'guide', 'case_study');

-- Create insights content status enum
CREATE TYPE public.insight_status AS ENUM ('draft', 'published', 'archived', 'scheduled');

-- Create insights table
CREATE TABLE public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subtitle TEXT,
  description TEXT, -- Short description for previews
  content TEXT NOT NULL, -- Main content (markdown supported)
  summary TEXT, -- Key takeaways summary
  insight_type insight_type NOT NULL DEFAULT 'blog_article',
  status insight_status NOT NULL DEFAULT 'draft',
  
  -- Book summary specific fields
  book_title TEXT, -- Original book title if type is book_summary
  book_author TEXT, -- Book author if type is book_summary
  book_isbn TEXT, -- ISBN for book summaries
  book_publication_year INTEGER, -- Publication year
  
  -- Content metadata
  reading_time_minutes INTEGER, -- Estimated reading time
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  
  -- Media
  image_url TEXT, -- Cover image or article hero image
  thumbnail_url TEXT, -- Smaller preview image
  
  -- SEO and categorization
  tags TEXT[], -- Array of tags for categorization
  keywords TEXT[], -- SEO keywords
  category TEXT, -- Main category (e.g., 'Finance Transformation', 'Leadership', 'Technology')
  
  -- Publishing metadata
  published_at TIMESTAMP WITH TIME ZONE,
  featured BOOLEAN DEFAULT FALSE, -- Featured content appears prominently
  view_count INTEGER DEFAULT 0,
  
  -- Audit fields
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create insights_categories table for better organization
CREATE TABLE public.insights_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT, -- Hex color for UI theming
  icon TEXT, -- Icon name for UI
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key relationship
ALTER TABLE public.insights 
ADD COLUMN category_id UUID REFERENCES public.insights_categories(id);

-- Create indexes for performance
CREATE INDEX idx_insights_type ON public.insights(insight_type);
CREATE INDEX idx_insights_status ON public.insights(status);
CREATE INDEX idx_insights_category ON public.insights(category_id);
CREATE INDEX idx_insights_published_at ON public.insights(published_at);
CREATE INDEX idx_insights_featured ON public.insights(featured);
CREATE INDEX idx_insights_tags ON public.insights USING GIN(tags);
CREATE INDEX idx_insights_slug ON public.insights(slug);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_insights_updated_at
  BEFORE UPDATE ON public.insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_insights_updated_at();

-- Insert default categories
INSERT INTO public.insights_categories (name, slug, description, color, icon, sort_order) VALUES
('Finance Transformation', 'finance-transformation', 'Digital transformation in finance and accounting', '#13B87B', 'TrendingUp', 1),
('Leadership & Strategy', 'leadership-strategy', 'Leadership insights and strategic thinking', '#003FA5', 'Users', 2),
('Technology & Tools', 'technology-tools', 'Technology reviews, comparisons and implementations', '#7C3AED', 'Wrench', 3),
('Process Optimization', 'process-optimization', 'Workflow improvements and efficiency gains', '#DC2626', 'RefreshCw', 4),
('Career Development', 'career-development', 'Professional growth and skill development', '#059669', 'User', 5);

-- Add RLS policies
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights_categories ENABLE ROW LEVEL SECURITY;

-- Public can read published insights
CREATE POLICY "Public can read published insights" ON public.insights
  FOR SELECT USING (status = 'published');

-- Public can read all categories
CREATE POLICY "Public can read categories" ON public.insights_categories
  FOR SELECT USING (true);

-- Authors can manage their own insights
CREATE POLICY "Authors can manage their insights" ON public.insights
  FOR ALL USING (auth.uid() = created_by);

-- Admins can manage all insights (you'll need to define admin role)
-- CREATE POLICY "Admins can manage all insights" ON public.insights
--   FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Add comments for documentation
COMMENT ON TABLE public.insights IS 'Rich content for the Insights tab: book summaries, blog articles, guides, and case studies';
COMMENT ON COLUMN public.insights.content IS 'Main content body, supports markdown formatting';
COMMENT ON COLUMN public.insights.reading_time_minutes IS 'Estimated reading time for user experience';
COMMENT ON COLUMN public.insights.difficulty_level IS 'Content complexity level for audience targeting';
COMMENT ON COLUMN public.insights.featured IS 'Featured content displayed prominently in UI';