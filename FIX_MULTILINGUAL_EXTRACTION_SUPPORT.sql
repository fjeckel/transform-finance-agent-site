-- Fix Multilingual Support for Content Extraction System
-- Fixed version - handles VARCHAR length constraints properly
-- Run this in Supabase SQL editor to add language capabilities
-- Created: 2025-08-10 (Fixed)

-- =============================================================================
-- EXTEND CONTENT EXTRACTIONS TABLE
-- =============================================================================

-- Add language support columns to existing content_extractions table
ALTER TABLE content_extractions 
ADD COLUMN IF NOT EXISTS source_language VARCHAR(10) DEFAULT 'auto', -- Changed to VARCHAR(10) and shortened default
ADD COLUMN IF NOT EXISTS target_languages TEXT[] DEFAULT ARRAY['en'],
ADD COLUMN IF NOT EXISTS multilingual_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS translation_cost_usd DECIMAL(10,6) DEFAULT 0;

-- Add comment to explain the source_language values
COMMENT ON COLUMN content_extractions.source_language IS 'Source language code or "auto" for auto-detection';

-- Add indexes for language queries
CREATE INDEX IF NOT EXISTS idx_content_extractions_source_language ON content_extractions(source_language);
CREATE INDEX IF NOT EXISTS idx_content_extractions_target_languages ON content_extractions USING GIN(target_languages);

-- =============================================================================
-- CREATE EXTRACTION TRANSLATIONS TABLE
-- =============================================================================

-- Table to store translations for each extraction
CREATE TABLE IF NOT EXISTS extraction_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extraction_id UUID NOT NULL REFERENCES content_extractions(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL, -- Standard ISO language codes only
  
  -- Translated content fields (mirrors extracted_fields structure)
  translated_fields JSONB NOT NULL DEFAULT '{}',
  confidence_scores JSONB DEFAULT '{}', -- Per-field confidence in translation
  
  -- Translation processing metadata
  translation_method TEXT DEFAULT 'ai' CHECK (translation_method IN ('ai', 'manual', 'hybrid', 'imported')),
  ai_provider TEXT CHECK (ai_provider IN ('openai', 'claude', 'grok')),
  ai_model TEXT, -- e.g., 'gpt-4o-mini'
  
  -- Cost and performance tracking
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  translation_cost_usd DECIMAL(10,6) DEFAULT 0,
  processing_time_ms INTEGER,
  
  -- Quality and status tracking
  translation_status TEXT DEFAULT 'pending' CHECK (translation_status IN (
    'pending', 'processing', 'completed', 'failed', 'review_needed', 'approved'
  )),
  quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
  validation_errors JSONB DEFAULT '[]',
  
  -- Review workflow
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one translation per language per extraction
  UNIQUE(extraction_id, language_code)
);

-- Add foreign key constraint to languages table (only for valid ISO codes, not 'auto')
-- We'll handle this programmatically since 'auto' isn't a real language code

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_extraction_translations_extraction_id ON extraction_translations(extraction_id);
CREATE INDEX IF NOT EXISTS idx_extraction_translations_language_code ON extraction_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_extraction_translations_status ON extraction_translations(translation_status);
CREATE INDEX IF NOT EXISTS idx_extraction_translations_created_at ON extraction_translations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_extraction_translations_quality ON extraction_translations(quality_score DESC);

-- =============================================================================
-- UPDATE TRIGGERS
-- =============================================================================

-- Add updated_at trigger for extraction_translations
CREATE TRIGGER update_extraction_translations_updated_at 
  BEFORE UPDATE ON extraction_translations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on new table
ALTER TABLE extraction_translations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage extraction translations
CREATE POLICY "Authenticated users can manage extraction translations" ON extraction_translations
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Grant permissions to service role
GRANT ALL ON extraction_translations TO service_role;
GRANT ALL ON extraction_translations TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =============================================================================
-- HELPER VIEWS FOR MULTILINGUAL QUERIES
-- =============================================================================

-- View to get extractions with their available translations
CREATE OR REPLACE VIEW extraction_with_translations AS
SELECT 
  ce.*,
  COALESCE(
    json_agg(
      json_build_object(
        'language_code', et.language_code,
        'translation_status', et.translation_status,
        'quality_score', et.quality_score,
        'translated_fields', et.translated_fields,
        'created_at', et.created_at
      ) ORDER BY et.created_at
    ) FILTER (WHERE et.id IS NOT NULL),
    '[]'::json
  ) as translations,
  array_agg(et.language_code) FILTER (WHERE et.translation_status = 'completed') as completed_languages,
  COALESCE(SUM(et.translation_cost_usd), 0) as total_translation_cost
FROM content_extractions ce
LEFT JOIN extraction_translations et ON ce.id = et.extraction_id
GROUP BY ce.id;

-- =============================================================================
-- FUNCTIONS FOR TRANSLATION MANAGEMENT
-- =============================================================================

-- Function to calculate estimated translation cost
CREATE OR REPLACE FUNCTION estimate_translation_cost(
  content_length INTEGER,
  target_language_count INTEGER,
  provider TEXT DEFAULT 'openai'
) RETURNS DECIMAL(10,6) AS $$
DECLARE
  cost_per_1k_tokens DECIMAL(10,6);
  estimated_tokens INTEGER;
  total_cost DECIMAL(10,6);
BEGIN
  -- Cost estimates (as of 2025, subject to change)
  CASE provider
    WHEN 'openai' THEN cost_per_1k_tokens := 0.00015; -- GPT-4o-mini input pricing
    WHEN 'claude' THEN cost_per_1k_tokens := 0.00025; -- Claude-3-haiku pricing
    WHEN 'grok' THEN cost_per_1k_tokens := 0.0001;    -- Grok pricing estimate
    ELSE cost_per_1k_tokens := 0.00015;
  END CASE;
  
  -- Rough estimation: 4 characters per token, plus 50% overhead for prompts and output
  estimated_tokens := (content_length / 4) * 1.8; -- 80% overhead for prompts + output
  
  total_cost := (estimated_tokens / 1000.0) * cost_per_1k_tokens * target_language_count;
  
  -- Minimum cost floor
  IF total_cost < 0.0001 THEN
    total_cost := 0.0001 * target_language_count;
  END IF;
  
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- Function to validate language codes
CREATE OR REPLACE FUNCTION is_valid_language_code(lang_code TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if it's a valid ISO language code in our languages table
  -- OR if it's our special 'auto' value
  RETURN (
    lang_code = 'auto' OR
    EXISTS (SELECT 1 FROM languages WHERE code = lang_code AND is_active = true)
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- UPDATE EXTRACTION TEMPLATES FOR MULTILINGUAL
-- =============================================================================

-- Add multilingual field to extraction templates (if not already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'extraction_templates' 
    AND column_name = 'supports_multilingual'
  ) THEN
    ALTER TABLE extraction_templates 
    ADD COLUMN supports_multilingual BOOLEAN DEFAULT true,
    ADD COLUMN default_target_languages TEXT[] DEFAULT ARRAY['en', 'de'];
  END IF;
END $$;

-- Update existing templates to support multilingual (only if columns exist)
UPDATE extraction_templates 
SET 
  supports_multilingual = true,
  default_target_languages = ARRAY['en', 'de', 'fr', 'es']
WHERE supports_multilingual IS NULL;

-- =============================================================================
-- LANGUAGE VALIDATION CONSTRAINTS
-- =============================================================================

-- Add check constraint for valid language codes in extraction_translations
-- (This will be enforced at application level for source_language since it can be 'auto')
ALTER TABLE extraction_translations 
ADD CONSTRAINT valid_language_code CHECK (
  language_code IN (SELECT code FROM languages WHERE is_active = true)
);

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE extraction_translations IS 'Translations of AI-extracted content in multiple languages';
COMMENT ON COLUMN extraction_translations.translated_fields IS 'JSON object containing translated versions of all extracted fields';
COMMENT ON COLUMN extraction_translations.confidence_scores IS 'Per-field confidence scores for translation quality (0.0-1.0)';
COMMENT ON COLUMN extraction_translations.translation_method IS 'Method used for translation: ai, manual, hybrid, or imported';
COMMENT ON COLUMN extraction_translations.quality_score IS 'Overall translation quality score calculated from multiple factors';
COMMENT ON COLUMN extraction_translations.language_code IS 'ISO language code (must exist in languages table)';

COMMENT ON VIEW extraction_with_translations IS 'Extractions with their available translations for easy querying';

COMMENT ON FUNCTION estimate_translation_cost IS 'Estimates the cost for translating content based on length and target languages';
COMMENT ON FUNCTION is_valid_language_code IS 'Validates if a language code is supported (including "auto" for auto-detection)';

-- =============================================================================
-- SAMPLE DATA FOR TESTING (Optional)
-- =============================================================================

-- Insert some additional language codes if they don't exist
INSERT INTO languages (code, name, native_name, is_default, is_active, sort_order, flag_emoji) VALUES
('it', 'Italian', 'Italiano', FALSE, TRUE, 5, '🇮🇹'),
('pt', 'Portuguese', 'Português', FALSE, TRUE, 6, '🇵🇹'),
('nl', 'Dutch', 'Nederlands', FALSE, TRUE, 7, '🇳🇱')
ON CONFLICT (code) DO NOTHING;

-- Success message
SELECT 'Multilingual extraction support added successfully! 

✅ Fixed VARCHAR length constraints
✅ Added language columns to content_extractions table  
✅ Created extraction_translations table with full workflow support
✅ Added performance indexes and RLS policies
✅ Created helper views and cost estimation functions
✅ Updated extraction templates for multilingual support
✅ Added proper validation constraints

Key changes from original:
- Changed source_language from VARCHAR(5) to VARCHAR(10) 
- Use "auto" instead of "auto-detect" (fits in constraint)
- Added validation functions for language codes
- Enhanced cost estimation with realistic pricing

Ready for UI integration!' as status;