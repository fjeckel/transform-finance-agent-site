-- COMPLETE AI RESEARCH SYSTEM SETUP FOR PRODUCTION
-- Run this SQL in Supabase SQL Editor to set up the entire AI Research system
-- URL: https://supabase.com/dashboard/project/aumijfxmeclxweojrefa/sql

-- Create enum types for AI Research system
DO $$ BEGIN
    CREATE TYPE public.research_session_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.research_task_type AS ENUM ('comparative_analysis', 'market_research', 'competitive_analysis', 'trend_analysis', 'risk_assessment', 'investment_analysis', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.ai_provider AS ENUM ('openai', 'claude', 'grok', 'parallel');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create main research sessions table
CREATE TABLE IF NOT EXISTS public.research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  session_title TEXT NOT NULL DEFAULT 'Research Session',
  description TEXT,
  research_type research_task_type NOT NULL DEFAULT 'custom',
  research_prompt TEXT NOT NULL,
  max_tokens INTEGER DEFAULT 4000,
  temperature DECIMAL(3,2) DEFAULT 0.3,
  status research_session_status DEFAULT 'pending',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  estimated_cost_usd DECIMAL(10,4) DEFAULT 0,
  actual_cost_usd DECIMAL(10,4) DEFAULT 0,
  
  -- Chat history features
  conversation_metadata JSONB DEFAULT '{
    "message_count": 1,
    "last_activity": null,
    "tags": [],
    "favorite": false,
    "archived": false,
    "total_cost": 0,
    "provider_usage": {}
  }',
  folder_id UUID,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create research results table for individual AI provider responses
CREATE TABLE IF NOT EXISTS public.research_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.research_sessions(id) ON DELETE CASCADE NOT NULL,
  ai_provider ai_provider NOT NULL,
  model_name TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  response_text TEXT,
  response_metadata JSONB DEFAULT '{}',
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,4) DEFAULT 0,
  processing_time_ms INTEGER DEFAULT 0,
  error_message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create research comparisons table for side-by-side analysis
CREATE TABLE IF NOT EXISTS public.research_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.research_sessions(id) ON DELETE CASCADE NOT NULL,
  claude_result_id UUID REFERENCES public.research_results(id),
  openai_result_id UUID REFERENCES public.research_results(id),
  comparison_notes TEXT,
  preference_rating INTEGER CHECK (preference_rating BETWEEN -5 AND 5),
  quality_scores JSONB DEFAULT '{"claude": null, "openai": null, "overall": null}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session folders for organization
CREATE TABLE IF NOT EXISTS public.research_session_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT 'folder',
  sort_order INTEGER DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create session tags for better organization
CREATE TABLE IF NOT EXISTS public.research_session_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.research_sessions(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, tag)
);

-- Create cost tracking table for budget management
CREATE TABLE IF NOT EXISTS public.research_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.research_sessions(id) ON DELETE CASCADE,
  ai_provider ai_provider NOT NULL,
  model_name TEXT NOT NULL,
  operation_type TEXT NOT NULL DEFAULT 'research',
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,4) NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user quota management table
CREATE TABLE IF NOT EXISTS public.user_research_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  monthly_token_limit INTEGER DEFAULT 100000,
  monthly_cost_limit_usd DECIMAL(8,2) DEFAULT 50.00,
  tokens_used_this_month INTEGER DEFAULT 0,
  cost_spent_this_month DECIMAL(8,2) DEFAULT 0,
  current_period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  current_period_end DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
  quota_reset_day INTEGER DEFAULT 1,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create research templates for common use cases
CREATE TABLE IF NOT EXISTS public.research_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  research_type research_task_type NOT NULL,
  prompt_template TEXT NOT NULL,
  suggested_max_tokens INTEGER DEFAULT 4000,
  suggested_temperature DECIMAL(3,2) DEFAULT 0.3,
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for folder_id after table creation
ALTER TABLE public.research_sessions 
ADD CONSTRAINT fk_research_sessions_folder_id 
FOREIGN KEY (folder_id) REFERENCES public.research_session_folders(id) ON DELETE SET NULL;

-- Enable Row Level Security on all tables
ALTER TABLE public.research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_session_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_session_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_research_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for research sessions
CREATE POLICY "Users can view their own research sessions" ON public.research_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own research sessions" ON public.research_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own research sessions" ON public.research_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own research sessions" ON public.research_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for research results
CREATE POLICY "Users can view results for their sessions" ON public.research_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.research_sessions 
      WHERE research_sessions.id = research_results.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert research results" ON public.research_results
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update research results" ON public.research_results
  FOR UPDATE USING (true);

-- Create RLS policies for research comparisons
CREATE POLICY "Users can view comparisons for their sessions" ON public.research_comparisons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.research_sessions 
      WHERE research_sessions.id = research_comparisons.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comparisons for their sessions" ON public.research_comparisons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.research_sessions 
      WHERE research_sessions.id = research_comparisons.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

-- Create RLS policies for folders
CREATE POLICY "Users can view their own folders" ON public.research_session_folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders" ON public.research_session_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON public.research_session_folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON public.research_session_folders
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for tags
CREATE POLICY "Users can view tags for their sessions" ON public.research_session_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.research_sessions 
      WHERE research_sessions.id = research_session_tags.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tags for their sessions" ON public.research_session_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.research_sessions 
      WHERE research_sessions.id = research_session_tags.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tags from their sessions" ON public.research_session_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.research_sessions 
      WHERE research_sessions.id = research_session_tags.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

-- Create RLS policies for research costs
CREATE POLICY "Users can view their own costs" ON public.research_costs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert cost records" ON public.research_costs
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for user quotas
CREATE POLICY "Users can view their own quotas" ON public.user_research_quotas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotas" ON public.user_research_quotas
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for research templates
CREATE POLICY "Anyone can view public templates" ON public.research_templates
  FOR SELECT USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Users can create templates" ON public.research_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates" ON public.research_templates
  FOR UPDATE USING (auth.uid() = created_by);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_sessions_user_id ON public.research_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_status ON public.research_sessions(status);
CREATE INDEX IF NOT EXISTS idx_research_sessions_created_at ON public.research_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_sessions_updated_at ON public.research_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_sessions_session_title ON public.research_sessions USING gin(to_tsvector('english', session_title));
CREATE INDEX IF NOT EXISTS idx_research_sessions_folder_id ON public.research_sessions(folder_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_conversation_metadata ON public.research_sessions USING gin(conversation_metadata);

CREATE INDEX IF NOT EXISTS idx_research_results_session_id ON public.research_results(session_id);
CREATE INDEX IF NOT EXISTS idx_research_results_provider ON public.research_results(ai_provider);
CREATE INDEX IF NOT EXISTS idx_research_comparisons_session_id ON public.research_comparisons(session_id);
CREATE INDEX IF NOT EXISTS idx_research_costs_user_id ON public.research_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_research_costs_billing_period ON public.research_costs(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_user_quotas_user_id ON public.user_research_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON public.research_templates(research_type);
CREATE INDEX IF NOT EXISTS idx_templates_public ON public.research_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_research_session_folders_user_id ON public.research_session_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_research_session_tags_session_id ON public.research_session_tags(session_id);

-- Function to generate session titles
CREATE OR REPLACE FUNCTION public.generate_session_title(prompt_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cleaned_prompt TEXT;
  title TEXT;
BEGIN
  -- Remove common research keywords and clean the prompt
  cleaned_prompt := regexp_replace(
    lower(prompt_text), 
    '(please |analyze |research |study |investigate |examine |conduct )', 
    '', 'g'
  );
  
  -- Take first meaningful phrase (max 50 chars)
  title := substring(trim(cleaned_prompt) from 1 for 50);
  
  -- Add ellipsis if truncated
  IF length(trim(cleaned_prompt)) > 50 THEN
    title := title || '...';
  END IF;
  
  -- Capitalize first letter
  title := upper(substring(title from 1 for 1)) || substring(title from 2);
  
  -- Fallback to generic title if empty
  IF title IS NULL OR trim(title) = '' OR trim(title) = '...' THEN
    title := 'Research Session';
  END IF;
  
  RETURN title;
END;
$$;

-- Function to update session metadata
CREATE OR REPLACE FUNCTION public.update_session_metadata(
  p_session_id UUID,
  p_cost DECIMAL DEFAULT 0,
  p_provider TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_metadata JSONB;
  provider_usage JSONB;
BEGIN
  -- Get current metadata
  SELECT conversation_metadata INTO current_metadata
  FROM public.research_sessions
  WHERE id = p_session_id;
  
  -- Initialize if null
  IF current_metadata IS NULL THEN
    current_metadata := '{
      "message_count": 0,
      "last_activity": null,
      "tags": [],
      "favorite": false,
      "archived": false,
      "total_cost": 0,
      "provider_usage": {}
    }'::jsonb;
  END IF;
  
  -- Update metadata
  current_metadata := jsonb_set(current_metadata, '{last_activity}', to_jsonb(NOW()));
  current_metadata := jsonb_set(current_metadata, '{message_count}', 
    to_jsonb((current_metadata->>'message_count')::int + 1));
  
  -- Update cost tracking
  IF p_cost > 0 THEN
    current_metadata := jsonb_set(current_metadata, '{total_cost}', 
      to_jsonb((current_metadata->>'total_cost')::decimal + p_cost));
  END IF;
  
  -- Update provider usage
  IF p_provider IS NOT NULL THEN
    provider_usage := COALESCE(current_metadata->'provider_usage', '{}'::jsonb);
    provider_usage := jsonb_set(provider_usage, ARRAY[p_provider], 
      to_jsonb(COALESCE((provider_usage->>p_provider)::int, 0) + 1));
    current_metadata := jsonb_set(current_metadata, '{provider_usage}', provider_usage);
  END IF;
  
  -- Update the session
  UPDATE public.research_sessions
  SET conversation_metadata = current_metadata,
      updated_at = NOW()
  WHERE id = p_session_id;
END;
$$;

-- Function to update folder session count
CREATE OR REPLACE FUNCTION public.update_folder_session_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update old folder count
  IF OLD.folder_id IS NOT NULL THEN
    UPDATE public.research_session_folders
    SET session_count = (
      SELECT COUNT(*) FROM public.research_sessions 
      WHERE folder_id = OLD.folder_id
    )
    WHERE id = OLD.folder_id;
  END IF;
  
  -- Update new folder count
  IF NEW.folder_id IS NOT NULL THEN
    UPDATE public.research_session_folders
    SET session_count = (
      SELECT COUNT(*) FROM public.research_sessions 
      WHERE folder_id = NEW.folder_id
    )
    WHERE id = NEW.folder_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to maintain folder session counts
DROP TRIGGER IF EXISTS update_folder_session_count_trigger ON public.research_sessions;
CREATE TRIGGER update_folder_session_count_trigger
  AFTER UPDATE OF folder_id ON public.research_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_folder_session_count();

-- Insert default research templates
INSERT INTO public.research_templates (name, description, research_type, prompt_template, is_public, created_by) VALUES
('Market Analysis Template', 'Comprehensive market analysis for a specific industry or sector', 'market_research', 
'Please conduct a comprehensive market analysis for the following industry/sector: {{industry}}

Include the following key areas in your analysis:

1. **Market Size & Growth**: Current market size, historical growth trends, and projected growth rates
2. **Key Players**: Major companies, market share distribution, competitive landscape
3. **Market Drivers**: Primary factors driving growth and demand
4. **Challenges & Risks**: Major obstacles, regulatory issues, economic factors
5. **Opportunities**: Emerging trends, untapped segments, growth opportunities
6. **Consumer Behavior**: Target demographics, purchasing patterns, preferences
7. **Technology Impact**: How technology is reshaping the industry
8. **Future Outlook**: 3-5 year projections and key trends to watch

Please provide specific data points, statistics, and actionable insights where possible. Focus on recent developments and current market dynamics.', 
true, NULL),

('Competitive Analysis Template', 'Deep dive analysis comparing competitors in a specific market', 'competitive_analysis',
'Please conduct a detailed competitive analysis for {{company_name}} in the {{industry}} industry.

**Primary Competitors to Analyze**: {{competitors}}

For each competitor, provide:

1. **Business Model**: Revenue streams, pricing strategy, target market
2. **Strengths**: Key advantages, unique value propositions, market position
3. **Weaknesses**: Areas of vulnerability, customer complaints, limitations
4. **Market Share**: Relative position and trends
5. **Financial Performance**: Revenue, profitability, growth metrics (if available)
6. **Product/Service Offerings**: Portfolio analysis, feature comparison
7. **Marketing Strategy**: Brand positioning, customer acquisition channels
8. **Recent Developments**: New launches, partnerships, strategic moves

**Strategic Recommendations**:
- Competitive advantages to leverage
- Market gaps to exploit
- Defensive strategies needed
- Areas for differentiation

Focus on actionable insights that can inform strategic decision-making.', 
true, NULL),

('Investment Analysis Template', 'Comprehensive investment opportunity analysis', 'investment_analysis',
'Please conduct an investment analysis for {{investment_opportunity}} (company/asset/market).

**Investment Overview**:
- Investment type and structure
- Required capital and timeline
- Expected returns and exit strategy

**Financial Analysis**:
1. **Revenue Model**: How the investment generates returns
2. **Financial Metrics**: Key performance indicators, growth rates
3. **Valuation**: Current valuation methods and comparables
4. **Unit Economics**: Cost structure, margins, scalability

**Risk Assessment**:
1. **Market Risks**: Industry challenges, competitive threats
2. **Execution Risks**: Management team, operational challenges
3. **Financial Risks**: Cash flow, funding requirements, debt levels
4. **Regulatory Risks**: Compliance, policy changes
5. **Technology Risks**: Disruption, obsolescence

**Growth Potential**:
- Market opportunity size
- Scalability factors
- Competitive advantages
- Growth catalysts

**Investment Recommendation**:
- Overall assessment (Strong Buy/Buy/Hold/Sell/Strong Sell)
- Target allocation or investment size
- Key monitoring metrics
- Exit strategy considerations

Provide specific reasoning for all recommendations with supporting data.', 
true, NULL)
ON CONFLICT DO NOTHING;

-- Create default folders for existing users (if any exist)
-- This will be empty for new installations but safe to run

-- Add helpful comments
COMMENT ON TABLE public.research_sessions IS 'User research sessions with AI providers - includes chat history features';
COMMENT ON TABLE public.research_results IS 'Individual AI provider responses for each session';
COMMENT ON TABLE public.research_comparisons IS 'Side-by-side comparisons between Claude and OpenAI results';
COMMENT ON TABLE public.research_session_folders IS 'Folders for organizing research sessions (like ChatGPT folders)';
COMMENT ON TABLE public.research_session_tags IS 'Tags for research sessions for better searchability';
COMMENT ON TABLE public.research_costs IS 'Detailed cost tracking for all AI operations';
COMMENT ON TABLE public.user_research_quotas IS 'User quota management and billing limits';
COMMENT ON TABLE public.research_templates IS 'Reusable research prompt templates';

-- Final success message
DO $$
BEGIN
  RAISE NOTICE 'AI Research System setup completed successfully!';
  RAISE NOTICE 'Tables created: research_sessions, research_results, research_comparisons, research_session_folders, research_session_tags, research_costs, user_research_quotas, research_templates';
  RAISE NOTICE 'All RLS policies and indexes have been applied.';
  RAISE NOTICE 'Chat history sidebar should now work with full functionality!';
END $$;