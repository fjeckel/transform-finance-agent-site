-- Migration: Implement comprehensive multilingual content support
-- This enables multi-language functionality for insights, episodes, and categories
-- with secure auto-translation capabilities via OpenAI integration

-- =============================================================================
-- LANGUAGES TABLE
-- =============================================================================

-- Create languages table to manage supported languages
CREATE TABLE public.languages (
  code VARCHAR(5) PRIMARY KEY, -- ISO language codes: 'en', 'de', 'fr', 'es-MX'
  name VARCHAR(50) NOT NULL, -- Display name: 'English', 'German', 'French'
  native_name VARCHAR(50) NOT NULL, -- Native name: 'English', 'Deutsch', 'Français'
  is_default BOOLEAN DEFAULT FALSE, -- Default language for the platform
  is_active BOOLEAN DEFAULT TRUE, -- Whether this language is available
  sort_order INTEGER DEFAULT 0, -- Display order in language selector
  flag_emoji VARCHAR(10), -- Flag emoji for UI display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default languages (German as primary, English as target)
INSERT INTO public.languages (code, name, native_name, is_default, is_active, sort_order, flag_emoji) VALUES
('de', 'German', 'Deutsch', TRUE, TRUE, 1, '🇩🇪'),
('en', 'English', 'English', FALSE, TRUE, 2, '🇺🇸'),
('fr', 'French', 'Français', FALSE, TRUE, 3, '🇫🇷'),
('es', 'Spanish', 'Español', FALSE, TRUE, 4, '🇪🇸');

-- =============================================================================
-- INSIGHTS TRANSLATIONS
-- =============================================================================

-- Create translation status enum
CREATE TYPE public.translation_status AS ENUM ('pending', 'in_progress', 'completed', 'review_needed', 'approved', 'rejected');

-- Create translation method enum  
CREATE TYPE public.translation_method AS ENUM ('manual', 'ai', 'hybrid', 'imported');

-- Create insights translations table
CREATE TABLE public.insights_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id UUID NOT NULL REFERENCES public.insights(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  
  -- Translatable content fields
  title TEXT,
  subtitle TEXT,
  description TEXT,
  content TEXT,
  summary TEXT,
  
  -- Book-specific translatable fields
  book_title TEXT,
  book_author TEXT,
  
  -- SEO and categorization (translatable)
  tags TEXT[], -- Translated tags
  keywords TEXT[], -- Translated keywords
  
  -- Translation metadata
  translation_status translation_status DEFAULT 'pending',
  translation_method translation_method DEFAULT 'manual',
  translation_quality_score DECIMAL(3,2) CHECK (translation_quality_score >= 0 AND translation_quality_score <= 1),
  
  -- Translation workflow
  translated_at TIMESTAMP WITH TIME ZONE,
  translated_by UUID REFERENCES public.profiles(id),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- OpenAI integration metadata
  openai_model VARCHAR(50), -- e.g., 'gpt-4o-mini'
  openai_prompt_tokens INTEGER,
  openai_completion_tokens INTEGER,
  openai_cost_usd DECIMAL(10,6), -- Track API costs
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one translation per language per insight
  UNIQUE(insight_id, language_code)
);

-- =============================================================================
-- EPISODES TRANSLATIONS
-- =============================================================================

-- Create episodes translations table
CREATE TABLE public.episodes_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  
  -- Translatable content fields
  title TEXT,
  description TEXT,
  content TEXT,
  summary TEXT,
  
  -- Translation metadata (same structure as insights)
  translation_status translation_status DEFAULT 'pending',
  translation_method translation_method DEFAULT 'manual',
  translation_quality_score DECIMAL(3,2) CHECK (translation_quality_score >= 0 AND translation_quality_score <= 1),
  
  -- Translation workflow
  translated_at TIMESTAMP WITH TIME ZONE,
  translated_by UUID REFERENCES public.profiles(id),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- OpenAI integration metadata
  openai_model VARCHAR(50),
  openai_prompt_tokens INTEGER,
  openai_completion_tokens INTEGER,
  openai_cost_usd DECIMAL(10,6),
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one translation per language per episode
  UNIQUE(episode_id, language_code)
);

-- =============================================================================
-- CATEGORIES TRANSLATIONS
-- =============================================================================

-- Create insights categories translations table
CREATE TABLE public.insights_categories_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.insights_categories(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  
  -- Translatable fields
  name TEXT,
  description TEXT,
  
  -- Translation metadata (simplified for categories)
  translation_status translation_status DEFAULT 'pending',
  translation_method translation_method DEFAULT 'manual',
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(category_id, language_code)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Insights translations indexes
CREATE INDEX idx_insights_translations_insight_id ON public.insights_translations(insight_id);
CREATE INDEX idx_insights_translations_language ON public.insights_translations(language_code);
CREATE INDEX idx_insights_translations_status ON public.insights_translations(translation_status);
CREATE INDEX idx_insights_translations_method ON public.insights_translations(translation_method);
CREATE INDEX idx_insights_translations_quality ON public.insights_translations(translation_quality_score);
CREATE INDEX idx_insights_translations_translated_at ON public.insights_translations(translated_at);

-- Episodes translations indexes
CREATE INDEX idx_episodes_translations_episode_id ON public.episodes_translations(episode_id);
CREATE INDEX idx_episodes_translations_language ON public.episodes_translations(language_code);
CREATE INDEX idx_episodes_translations_status ON public.episodes_translations(translation_status);

-- Categories translations indexes
CREATE INDEX idx_categories_translations_category_id ON public.insights_categories_translations(category_id);
CREATE INDEX idx_categories_translations_language ON public.insights_categories_translations(language_code);

-- Languages indexes
CREATE INDEX idx_languages_active ON public.languages(is_active);
CREATE INDEX idx_languages_default ON public.languages(is_default);
CREATE INDEX idx_languages_sort_order ON public.languages(sort_order);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_translation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for all translation tables
CREATE TRIGGER update_insights_translations_updated_at
  BEFORE UPDATE ON public.insights_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_translation_updated_at();

CREATE TRIGGER update_episodes_translations_updated_at
  BEFORE UPDATE ON public.episodes_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_translation_updated_at();

CREATE TRIGGER update_categories_translations_updated_at
  BEFORE UPDATE ON public.insights_categories_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_translation_updated_at();

CREATE TRIGGER update_languages_updated_at
  BEFORE UPDATE ON public.languages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_translation_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all translation tables
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights_categories_translations ENABLE ROW LEVEL SECURITY;

-- Public can read active languages
CREATE POLICY "Public can read active languages" ON public.languages
  FOR SELECT USING (is_active = TRUE);

-- Public can read completed translations for published content
CREATE POLICY "Public can read published insights translations" ON public.insights_translations
  FOR SELECT USING (
    translation_status = 'approved' AND 
    EXISTS (
      SELECT 1 FROM public.insights i 
      WHERE i.id = insight_id AND i.status = 'published'
    )
  );

CREATE POLICY "Public can read published episodes translations" ON public.episodes_translations
  FOR SELECT USING (
    translation_status = 'approved' AND 
    EXISTS (
      SELECT 1 FROM public.episodes e 
      WHERE e.id = episode_id AND e.status = 'published'
    )
  );

CREATE POLICY "Public can read approved category translations" ON public.insights_categories_translations
  FOR SELECT USING (translation_status = 'approved');

-- Authenticated users can manage their own translations
CREATE POLICY "Authors can manage their insights translations" ON public.insights_translations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.insights i 
      WHERE i.id = insight_id AND i.created_by = auth.uid()
    )
  );

-- Admins can manage all translations (to be implemented with role system)
-- CREATE POLICY "Admins can manage all translations" ON public.insights_translations
--   FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to get content with language fallback
CREATE OR REPLACE FUNCTION public.get_localized_insight(
  p_insight_id UUID,
  p_language_code VARCHAR(5) DEFAULT 'de'
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  content TEXT,
  summary TEXT,
  book_title TEXT,
  book_author TEXT,
  tags TEXT[],
  keywords TEXT[],
  language_code VARCHAR(5),
  is_translated BOOLEAN
) AS $$
BEGIN
  -- Try to get translated content first
  RETURN QUERY
  SELECT 
    i.id,
    COALESCE(it.title, i.title) as title,
    COALESCE(it.subtitle, i.subtitle) as subtitle,
    COALESCE(it.description, i.description) as description,
    COALESCE(it.content, i.content) as content,
    COALESCE(it.summary, i.summary) as summary,
    COALESCE(it.book_title, i.book_title) as book_title,
    COALESCE(it.book_author, i.book_author) as book_author,
    COALESCE(it.tags, i.tags) as tags,
    COALESCE(it.keywords, i.keywords) as keywords,
    p_language_code as language_code,
    (it.id IS NOT NULL AND it.translation_status = 'approved') as is_translated
  FROM public.insights i
  LEFT JOIN public.insights_translations it ON (
    it.insight_id = i.id 
    AND it.language_code = p_language_code 
    AND it.translation_status = 'approved'
  )
  WHERE i.id = p_insight_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get translation completeness statistics
CREATE OR REPLACE FUNCTION public.get_translation_stats()
RETURNS TABLE (
  language_code VARCHAR(5),
  language_name TEXT,
  insights_total INTEGER,
  insights_translated INTEGER,
  insights_completion_pct DECIMAL(5,2),
  episodes_total INTEGER,
  episodes_translated INTEGER,
  episodes_completion_pct DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.code,
    l.name,
    (SELECT COUNT(*)::INTEGER FROM public.insights WHERE status = 'published') as insights_total,
    (SELECT COUNT(*)::INTEGER FROM public.insights_translations it 
     JOIN public.insights i ON i.id = it.insight_id 
     WHERE it.language_code = l.code AND it.translation_status = 'approved' AND i.status = 'published') as insights_translated,
    ROUND(
      (SELECT COUNT(*) FROM public.insights_translations it 
       JOIN public.insights i ON i.id = it.insight_id 
       WHERE it.language_code = l.code AND it.translation_status = 'approved' AND i.status = 'published') * 100.0 / 
      GREATEST((SELECT COUNT(*) FROM public.insights WHERE status = 'published'), 1), 2
    ) as insights_completion_pct,
    (SELECT COUNT(*)::INTEGER FROM public.episodes WHERE status = 'published') as episodes_total,
    (SELECT COUNT(*)::INTEGER FROM public.episodes_translations et 
     JOIN public.episodes e ON e.id = et.episode_id 
     WHERE et.language_code = l.code AND et.translation_status = 'approved' AND e.status = 'published') as episodes_translated,
    ROUND(
      (SELECT COUNT(*) FROM public.episodes_translations et 
       JOIN public.episodes e ON e.id = et.episode_id 
       WHERE et.language_code = l.code AND et.translation_status = 'approved' AND e.status = 'published') * 100.0 / 
      GREATEST((SELECT COUNT(*) FROM public.episodes WHERE status = 'published'), 1), 2
    ) as episodes_completion_pct
  FROM public.languages l
  WHERE l.is_active = TRUE
  ORDER BY l.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.languages IS 'Supported languages for multilingual content';
COMMENT ON TABLE public.insights_translations IS 'Translations for insights content with AI integration tracking';
COMMENT ON TABLE public.episodes_translations IS 'Translations for episodes content with AI integration tracking';
COMMENT ON TABLE public.insights_categories_translations IS 'Translations for insight categories';

COMMENT ON COLUMN public.insights_translations.translation_quality_score IS 'AI-generated quality score (0.0-1.0) for translation assessment';
COMMENT ON COLUMN public.insights_translations.openai_cost_usd IS 'Tracks API costs for budget monitoring';
COMMENT ON FUNCTION public.get_localized_insight IS 'Returns localized content with fallback to original language';
COMMENT ON FUNCTION public.get_translation_stats IS 'Provides translation completeness statistics for admin dashboard';