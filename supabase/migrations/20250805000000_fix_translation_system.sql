-- Fix Translation System Issues
-- This migration fixes the translation table schema and permissions

-- First, let's ensure we have languages setup
INSERT INTO public.languages (code, name, native_name, is_active, is_default, sort_order) VALUES
  ('de', 'German', 'Deutsch', true, true, 1),
  ('en', 'English', 'English', true, false, 2),
  ('fr', 'French', 'Français', true, false, 3),
  ('es', 'Spanish', 'Español', true, false, 4)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  native_name = EXCLUDED.native_name,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- Add missing columns to episodes_translations if they don't exist
DO $$ 
BEGIN
  -- Add translation_status if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'episodes_translations' 
                 AND column_name = 'translation_status') THEN
    ALTER TABLE public.episodes_translations 
    ADD COLUMN translation_status TEXT DEFAULT 'draft' CHECK (translation_status IN ('draft', 'pending', 'completed', 'approved', 'rejected'));
  END IF;

  -- Add translation_method if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'episodes_translations' 
                 AND column_name = 'translation_method') THEN
    ALTER TABLE public.episodes_translations 
    ADD COLUMN translation_method TEXT DEFAULT 'manual' CHECK (translation_method IN ('manual', 'ai', 'hybrid'));
  END IF;

  -- Add translated_at if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'episodes_translations' 
                 AND column_name = 'translated_at') THEN
    ALTER TABLE public.episodes_translations 
    ADD COLUMN translated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;

  -- Add translated_by if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'episodes_translations' 
                 AND column_name = 'translated_by') THEN
    ALTER TABLE public.episodes_translations 
    ADD COLUMN translated_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add missing columns to insights_translations if they don't exist
DO $$ 
BEGIN
  -- Add translation_status if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'insights_translations' 
                 AND column_name = 'translation_status') THEN
    ALTER TABLE public.insights_translations 
    ADD COLUMN translation_status TEXT DEFAULT 'draft' CHECK (translation_status IN ('draft', 'pending', 'completed', 'approved', 'rejected'));
  END IF;

  -- Add translation_method if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'insights_translations' 
                 AND column_name = 'translation_method') THEN
    ALTER TABLE public.insights_translations 
    ADD COLUMN translation_method TEXT DEFAULT 'manual' CHECK (translation_method IN ('manual', 'ai', 'hybrid'));
  END IF;

  -- Add translated_at if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'insights_translations' 
                 AND column_name = 'translated_at') THEN
    ALTER TABLE public.insights_translations 
    ADD COLUMN translated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;

  -- Add translated_by if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'insights_translations' 
                 AND column_name = 'translated_by') THEN  
    ALTER TABLE public.insights_translations 
    ADD COLUMN translated_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Drop existing restrictive RLS policies and create more permissive ones for authenticated users
DROP POLICY IF EXISTS "Public can read published episodes translations" ON public.episodes_translations;
DROP POLICY IF EXISTS "Public can read published insights translations" ON public.insights_translations;

-- Allow authenticated users to read all translations (not just approved ones)
CREATE POLICY "Authenticated users can read all episodes translations" ON public.episodes_translations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read all insights translations" ON public.insights_translations  
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert translations
CREATE POLICY "Authenticated users can insert episodes translations" ON public.episodes_translations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert insights translations" ON public.insights_translations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update their own translations
CREATE POLICY "Authenticated users can update episodes translations" ON public.episodes_translations
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update insights translations" ON public.insights_translations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow public to read approved translations for published content (for frontend)
CREATE POLICY "Public can read approved episodes translations" ON public.episodes_translations
  FOR SELECT USING (
    translation_status = 'approved' AND 
    EXISTS (
      SELECT 1 FROM public.episodes e 
      WHERE e.id = episode_id AND e.status = 'published'
    )
  );

CREATE POLICY "Public can read approved insights translations" ON public.insights_translations
  FOR SELECT USING (
    translation_status = 'approved' AND 
    EXISTS (
      SELECT 1 FROM public.insights i 
      WHERE i.id = insight_id AND i.status = 'published'
    )
  );

-- Create insights_categories_translations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.insights_categories_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.insights_categories(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  
  -- Translatable content fields
  name TEXT,
  description TEXT,
  
  -- Translation metadata
  translation_status TEXT DEFAULT 'draft' CHECK (translation_status IN ('draft', 'pending', 'completed', 'approved', 'rejected')),
  translation_method TEXT DEFAULT 'manual' CHECK (translation_method IN ('manual', 'ai', 'hybrid')),
  translated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  translated_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  UNIQUE(category_id, language_code)
);

-- Enable RLS on categories translations
ALTER TABLE public.insights_categories_translations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for categories translations
CREATE POLICY "Authenticated users can manage categories translations" ON public.insights_categories_translations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can read approved categories translations" ON public.insights_categories_translations
  FOR SELECT USING (translation_status = 'approved');

-- Fix get_translation_stats function to handle missing data gracefully
CREATE OR REPLACE FUNCTION public.get_translation_stats()
RETURNS TABLE (
  language_code TEXT,
  language_name TEXT,
  insights_total INTEGER,
  insights_translated INTEGER,
  insights_completion_pct NUMERIC,
  episodes_total INTEGER,
  episodes_translated INTEGER,
  episodes_completion_pct NUMERIC
) 
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.code::TEXT as language_code,
    l.name::TEXT as language_name,
    COALESCE((SELECT COUNT(*)::INTEGER FROM public.insights WHERE status = 'published'), 0) as insights_total,
    COALESCE((SELECT COUNT(*)::INTEGER FROM public.insights_translations it 
     JOIN public.insights i ON i.id = it.insight_id 
     WHERE it.language_code = l.code AND it.translation_status IN ('completed', 'approved') AND i.status = 'published'), 0) as insights_translated,
    COALESCE(ROUND(
      CASE 
        WHEN (SELECT COUNT(*) FROM public.insights WHERE status = 'published') > 0 THEN
          (SELECT COUNT(*) FROM public.insights_translations it 
           JOIN public.insights i ON i.id = it.insight_id 
           WHERE it.language_code = l.code AND it.translation_status IN ('completed', 'approved') AND i.status = 'published') * 100.0 / 
          (SELECT COUNT(*) FROM public.insights WHERE status = 'published')
        ELSE 0
      END, 2
    ), 0) as insights_completion_pct,
    COALESCE((SELECT COUNT(*)::INTEGER FROM public.episodes WHERE status = 'published'), 0) as episodes_total,
    COALESCE((SELECT COUNT(*)::INTEGER FROM public.episodes_translations et 
     JOIN public.episodes e ON e.id = et.episode_id 
     WHERE et.language_code = l.code AND et.translation_status IN ('completed', 'approved') AND e.status = 'published'), 0) as episodes_translated,
    COALESCE(ROUND(
      CASE 
        WHEN (SELECT COUNT(*) FROM public.episodes WHERE status = 'published') > 0 THEN
          (SELECT COUNT(*) FROM public.episodes_translations et 
           JOIN public.episodes e ON e.id = et.episode_id 
           WHERE et.language_code = l.code AND et.translation_status IN ('completed', 'approved') AND e.status = 'published') * 100.0 / 
          (SELECT COUNT(*) FROM public.episodes WHERE status = 'published')
        ELSE 0
      END, 2
    ), 0) as episodes_completion_pct
  FROM public.languages l
  WHERE l.is_active = TRUE
  ORDER BY l.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.episodes_translations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.insights_translations TO authenticated; 
GRANT SELECT, INSERT, UPDATE ON public.insights_categories_translations TO authenticated;
GRANT SELECT ON public.languages TO authenticated, anon;