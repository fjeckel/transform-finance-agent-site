-- AI-Powered Content Extraction System Migration
-- Created: 2025-08-09
-- Purpose: Add tables and functionality for AI-powered episode content extraction

-- Content extraction sessions table
CREATE TABLE IF NOT EXISTS content_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  
  -- Source information
  source_type TEXT NOT NULL CHECK (source_type IN ('file', 'url', 'text', 'audio')),
  source_name TEXT, -- Original filename or URL
  source_content TEXT, -- Raw content or file path
  source_metadata JSONB DEFAULT '{}', -- File size, type, etc.
  
  -- Extraction results
  extracted_fields JSONB NOT NULL DEFAULT '{}', -- AI-extracted content
  confidence_scores JSONB DEFAULT '{}', -- Confidence for each field
  ai_provider TEXT NOT NULL, -- Which AI provider was used
  processing_cost_usd DECIMAL(10,6) DEFAULT 0,
  
  -- Processing information
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  processing_time_ms INTEGER,
  tokens_used JSONB DEFAULT '{}', -- Input/output tokens by provider
  
  -- Review workflow
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Quality metrics
  quality_score DECIMAL(3,2), -- 0.00-1.00 quality score
  validation_errors JSONB DEFAULT '[]', -- Array of validation issues
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Extraction processing history for tracking parallel AI operations
CREATE TABLE IF NOT EXISTS extraction_ai_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extraction_id UUID REFERENCES content_extractions(id) ON DELETE CASCADE,
  
  -- AI provider details
  provider TEXT NOT NULL CHECK (provider IN ('claude', 'openai', 'grok')),
  model TEXT NOT NULL,
  
  -- Processing details
  prompt_text TEXT,
  response_text TEXT,
  extracted_data JSONB,
  
  -- Metrics
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  processing_time_ms INTEGER,
  
  -- Quality assessment
  confidence_score DECIMAL(3,2),
  quality_metrics JSONB DEFAULT '{}',
  
  -- Status and errors
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Content extraction templates for different content types
CREATE TABLE IF NOT EXISTS extraction_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Template configuration
  content_type TEXT NOT NULL, -- 'podcast_episode', 'blog_post', 'transcript', etc.
  extraction_fields JSONB NOT NULL, -- Fields to extract and their prompts
  validation_rules JSONB DEFAULT '{}', -- Validation rules for each field
  
  -- AI configuration
  preferred_provider TEXT CHECK (preferred_provider IN ('claude', 'openai', 'grok')),
  model_settings JSONB DEFAULT '{}', -- Temperature, max_tokens, etc.
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Batch processing jobs for bulk content extraction
CREATE TABLE IF NOT EXISTS extraction_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Batch configuration
  template_id UUID REFERENCES extraction_templates(id),
  source_type TEXT NOT NULL,
  total_items INTEGER DEFAULT 0,
  
  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'paused')),
  processed_items INTEGER DEFAULT 0,
  successful_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  
  -- Cost tracking
  estimated_cost_usd DECIMAL(10,2),
  actual_cost_usd DECIMAL(10,2) DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Link extractions to batches
CREATE TABLE IF NOT EXISTS extraction_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES extraction_batches(id) ON DELETE CASCADE,
  extraction_id UUID REFERENCES content_extractions(id) ON DELETE CASCADE,
  
  -- Processing order and priority
  processing_order INTEGER,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  -- Item-specific settings
  item_settings JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_extractions_episode_id ON content_extractions(episode_id);
CREATE INDEX IF NOT EXISTS idx_content_extractions_status ON content_extractions(status);
CREATE INDEX IF NOT EXISTS idx_content_extractions_review_status ON content_extractions(review_status);
CREATE INDEX IF NOT EXISTS idx_content_extractions_created_at ON content_extractions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_extractions_created_by ON content_extractions(created_by);

CREATE INDEX IF NOT EXISTS idx_extraction_ai_results_extraction_id ON extraction_ai_results(extraction_id);
CREATE INDEX IF NOT EXISTS idx_extraction_ai_results_provider ON extraction_ai_results(provider);
CREATE INDEX IF NOT EXISTS idx_extraction_ai_results_status ON extraction_ai_results(status);

CREATE INDEX IF NOT EXISTS idx_extraction_templates_content_type ON extraction_templates(content_type);
CREATE INDEX IF NOT EXISTS idx_extraction_templates_usage_count ON extraction_templates(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_extraction_batches_status ON extraction_batches(status);
CREATE INDEX IF NOT EXISTS idx_extraction_batches_created_by ON extraction_batches(created_by);
CREATE INDEX IF NOT EXISTS idx_extraction_batch_items_batch_id ON extraction_batch_items(batch_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_extractions_updated_at 
  BEFORE UPDATE ON content_extractions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_extraction_templates_updated_at 
  BEFORE UPDATE ON extraction_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_extraction_batches_updated_at 
  BEFORE UPDATE ON extraction_batches 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default extraction templates
INSERT INTO extraction_templates (name, description, content_type, extraction_fields, validation_rules, preferred_provider, model_settings) 
VALUES 
(
  'Podcast Episode Standard',
  'Standard template for extracting podcast episode information',
  'podcast_episode',
  '{
    "title": {
      "prompt": "Extract the episode title. Look for patterns like Episode titles, headers, or main topics.",
      "required": true,
      "max_length": 200
    },
    "summary": {
      "prompt": "Create a concise 2-3 sentence summary of the episode content and key topics discussed.",
      "required": true,
      "max_length": 500
    },
    "description": {
      "prompt": "Generate a detailed description suitable for podcast directories, including key topics and guest information if mentioned.",
      "required": true,
      "max_length": 1000
    },
    "content": {
      "prompt": "Structure the main content with key points, topics discussed, and any important quotes or insights.",
      "required": false,
      "max_length": 10000
    },
    "key_topics": {
      "prompt": "Extract 3-7 key topics or themes discussed in the episode.",
      "required": false,
      "type": "array"
    },
    "guest_names": {
      "prompt": "Identify any guest names mentioned in the content.",
      "required": false,
      "type": "array"
    }
  }'::JSONB,
  '{
    "title": {"min_length": 10, "max_length": 200},
    "summary": {"min_length": 50, "max_length": 500},
    "description": {"min_length": 100, "max_length": 1000}
  }'::JSONB,
  'claude',
  '{"temperature": 0.3, "max_tokens": 4000}'::JSONB
),
(
  'Blog Post / Article',
  'Template for extracting structured content from blog posts and articles',
  'blog_post',
  '{
    "title": {
      "prompt": "Extract the main title or headline of the article.",
      "required": true,
      "max_length": 200
    },
    "summary": {
      "prompt": "Create an executive summary of the main points and conclusions.",
      "required": true,
      "max_length": 300
    },
    "description": {
      "prompt": "Generate a meta description suitable for SEO and social media sharing.",
      "required": true,
      "max_length": 160
    },
    "content": {
      "prompt": "Structure the content with clear sections, maintaining original formatting but improving readability.",
      "required": true,
      "max_length": 15000
    },
    "key_points": {
      "prompt": "Extract the main arguments or key points presented in the article.",
      "required": false,
      "type": "array"
    }
  }'::JSONB,
  '{
    "title": {"min_length": 10, "max_length": 200},
    "summary": {"min_length": 50, "max_length": 300},
    "description": {"min_length": 50, "max_length": 160}
  }'::JSONB,
  'claude',
  '{"temperature": 0.2, "max_tokens": 6000}'::JSONB
),
(
  'Transcript Processing',
  'Template for processing audio transcripts into structured episode content',
  'transcript',
  '{
    "title": {
      "prompt": "Based on the conversation, generate an engaging episode title that captures the main theme.",
      "required": true,
      "max_length": 200
    },
    "summary": {
      "prompt": "Summarize the key discussion points and conclusions from the transcript.",
      "required": true,
      "max_length": 400
    },
    "description": {
      "prompt": "Create a podcast description that highlights the main topics and value for listeners.",
      "required": true,
      "max_length": 800
    },
    "show_notes": {
      "prompt": "Create structured show notes with timestamps, key topics, and important quotes.",
      "required": false,
      "max_length": 3000
    },
    "quotes": {
      "prompt": "Extract 3-5 notable quotes or insights from the conversation.",
      "required": false,
      "type": "array"
    },
    "speakers": {
      "prompt": "Identify all speakers mentioned in the transcript.",
      "required": false,
      "type": "array"
    }
  }'::JSONB,
  '{
    "title": {"min_length": 10, "max_length": 200},
    "summary": {"min_length": 100, "max_length": 400},
    "description": {"min_length": 100, "max_length": 800}
  }'::JSONB,
  'grok',
  '{"temperature": 0.4, "max_tokens": 5000}'::JSONB
)
ON CONFLICT (name) DO NOTHING;

-- Row Level Security (RLS) policies
ALTER TABLE content_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_ai_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_batch_items ENABLE ROW LEVEL SECURITY;

-- Policies for content_extractions (admin users only)
CREATE POLICY "Admin can manage content extractions" ON content_extractions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        'fabian.jeckel@gmail.com', 
        'admin@financetransformers.com'
      )
    )
  );

-- Policies for extraction_ai_results (admin users only)
CREATE POLICY "Admin can manage AI results" ON extraction_ai_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        'fabian.jeckel@gmail.com', 
        'admin@financetransformers.com'
      )
    )
  );

-- Policies for extraction_templates (admin users only)
CREATE POLICY "Admin can manage templates" ON extraction_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        'fabian.jeckel@gmail.com', 
        'admin@financetransformers.com'
      )
    )
  );

-- Policies for extraction_batches (admin users only)
CREATE POLICY "Admin can manage batches" ON extraction_batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        'fabian.jeckel@gmail.com', 
        'admin@financetransformers.com'
      )
    )
  );

-- Policies for extraction_batch_items (admin users only)
CREATE POLICY "Admin can manage batch items" ON extraction_batch_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        'fabian.jeckel@gmail.com', 
        'admin@financetransformers.com'
      )
    )
  );

-- Grant permissions to service role
GRANT ALL ON content_extractions TO service_role;
GRANT ALL ON extraction_ai_results TO service_role;
GRANT ALL ON extraction_templates TO service_role;
GRANT ALL ON extraction_batches TO service_role;
GRANT ALL ON extraction_batch_items TO service_role;

-- Comments for documentation
COMMENT ON TABLE content_extractions IS 'Main table for tracking AI-powered content extraction sessions';
COMMENT ON TABLE extraction_ai_results IS 'Detailed results from each AI provider in parallel processing';
COMMENT ON TABLE extraction_templates IS 'Reusable templates for different types of content extraction';
COMMENT ON TABLE extraction_batches IS 'Batch processing jobs for bulk content extraction';
COMMENT ON TABLE extraction_batch_items IS 'Individual items within batch processing jobs';

COMMENT ON COLUMN content_extractions.extracted_fields IS 'JSON object containing all AI-extracted content fields';
COMMENT ON COLUMN content_extractions.confidence_scores IS 'Confidence scores for each extracted field (0.0-1.0)';
COMMENT ON COLUMN content_extractions.quality_score IS 'Overall quality score calculated from multiple factors';
COMMENT ON COLUMN extraction_templates.extraction_fields IS 'Configuration for fields to extract, including prompts and validation';