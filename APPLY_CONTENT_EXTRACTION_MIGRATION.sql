-- MANUAL DATABASE MIGRATION: AI Content Extraction System
-- Execute this SQL in your Supabase SQL Editor to enable the content extraction feature
-- URL: https://supabase.com/dashboard/project/[YOUR-PROJECT]/sql

-- Content extraction sessions table
CREATE TABLE IF NOT EXISTS content_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  
  -- Source information
  source_type TEXT NOT NULL CHECK (source_type IN ('file', 'url', 'text', 'audio')),
  source_name TEXT,
  source_content TEXT,
  source_metadata JSONB DEFAULT '{}',
  
  -- Extraction results
  extracted_fields JSONB NOT NULL DEFAULT '{}',
  confidence_scores JSONB DEFAULT '{}',
  ai_provider TEXT NOT NULL,
  processing_cost_usd DECIMAL(10,6) DEFAULT 0,
  
  -- Processing information
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  processing_time_ms INTEGER,
  tokens_used JSONB DEFAULT '{}',
  
  -- Review workflow
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Quality metrics
  quality_score DECIMAL(3,2),
  validation_errors JSONB DEFAULT '[]',
  
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
  content_type TEXT NOT NULL,
  extraction_fields JSONB NOT NULL,
  validation_rules JSONB DEFAULT '{}',
  
  -- AI configuration
  preferred_provider TEXT CHECK (preferred_provider IN ('claude', 'openai', 'grok')),
  model_settings JSONB DEFAULT '{}',
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_extractions_episode_id ON content_extractions(episode_id);
CREATE INDEX IF NOT EXISTS idx_content_extractions_status ON content_extractions(status);
CREATE INDEX IF NOT EXISTS idx_content_extractions_review_status ON content_extractions(review_status);
CREATE INDEX IF NOT EXISTS idx_content_extractions_created_at ON content_extractions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_extraction_ai_results_extraction_id ON extraction_ai_results(extraction_id);
CREATE INDEX IF NOT EXISTS idx_extraction_ai_results_provider ON extraction_ai_results(provider);

CREATE INDEX IF NOT EXISTS idx_extraction_templates_content_type ON extraction_templates(content_type);

-- Row Level Security (RLS) policies
ALTER TABLE content_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_ai_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_templates ENABLE ROW LEVEL SECURITY;

-- Policies for admin users only (adjust emails as needed)
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

-- Grant permissions to service role
GRANT ALL ON content_extractions TO service_role;
GRANT ALL ON extraction_ai_results TO service_role;
GRANT ALL ON extraction_templates TO service_role;

-- Insert default extraction templates
INSERT INTO extraction_templates (name, description, content_type, extraction_fields, preferred_provider, model_settings) 
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
    }
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
    }
  }'::JSONB,
  'grok',
  '{"temperature": 0.4, "max_tokens": 5000}'::JSONB
)
ON CONFLICT (name) DO NOTHING;

-- Success message
SELECT 'AI Content Extraction System migration completed successfully!' AS status;