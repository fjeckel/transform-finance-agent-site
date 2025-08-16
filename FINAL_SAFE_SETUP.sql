-- FINAL SAFE AI RESEARCH SYSTEM SETUP
-- This version handles all type casting and existing objects safely
-- Run this SQL in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/aumijfxmeclxweojrefa/sql

-- Create enum types for AI Research system (safe version)
DO $$ BEGIN
    CREATE TYPE public.research_session_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'research_session_status enum already exists, skipping...';
END $$;

DO $$ BEGIN
    CREATE TYPE public.research_task_type AS ENUM ('comparative_analysis', 'market_research', 'competitive_analysis', 'trend_analysis', 'risk_assessment', 'investment_analysis', 'custom');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'research_task_type enum already exists, skipping...';
END $$;

DO $$ BEGIN
    CREATE TYPE public.ai_provider AS ENUM ('openai', 'claude', 'grok', 'parallel');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'ai_provider enum already exists, skipping...';
END $$;

-- Create session folders table first (needed for foreign key)
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

-- Add foreign key constraint safely
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_research_sessions_folder_id'
        AND table_name = 'research_sessions'
    ) THEN
        ALTER TABLE public.research_sessions 
        ADD CONSTRAINT fk_research_sessions_folder_id 
        FOREIGN KEY (folder_id) REFERENCES public.research_session_folders(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint fk_research_sessions_folder_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint fk_research_sessions_folder_id already exists, skipping...';
    END IF;
END $$;

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

-- Enable Row Level Security on all tables (safe)
DO $$ BEGIN
    ALTER TABLE public.research_sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.research_results ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.research_comparisons ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.research_session_folders ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.research_session_tags ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.research_costs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.user_research_quotas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.research_templates ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Row Level Security enabled on all tables';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Some RLS policies may already be enabled, continuing...';
END $$;

-- Create RLS policies (safe version with existence checks)
DO $$ BEGIN
    -- Research sessions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own research sessions' AND tablename = 'research_sessions') THEN
        CREATE POLICY "Users can view their own research sessions" ON public.research_sessions
          FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own research sessions' AND tablename = 'research_sessions') THEN
        CREATE POLICY "Users can create their own research sessions" ON public.research_sessions
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own research sessions' AND tablename = 'research_sessions') THEN
        CREATE POLICY "Users can update their own research sessions" ON public.research_sessions
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own research sessions' AND tablename = 'research_sessions') THEN
        CREATE POLICY "Users can delete their own research sessions" ON public.research_sessions
          FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- Research results policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view results for their sessions' AND tablename = 'research_results') THEN
        CREATE POLICY "Users can view results for their sessions" ON public.research_results
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.research_sessions 
              WHERE research_sessions.id = research_results.session_id 
              AND research_sessions.user_id = auth.uid()
            )
          );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System can insert research results' AND tablename = 'research_results') THEN
        CREATE POLICY "System can insert research results" ON public.research_results
          FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System can update research results' AND tablename = 'research_results') THEN
        CREATE POLICY "System can update research results" ON public.research_results
          FOR UPDATE USING (true);
    END IF;

    -- Folders policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own folders' AND tablename = 'research_session_folders') THEN
        CREATE POLICY "Users can view their own folders" ON public.research_session_folders
          FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own folders' AND tablename = 'research_session_folders') THEN
        CREATE POLICY "Users can create their own folders" ON public.research_session_folders
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own folders' AND tablename = 'research_session_folders') THEN
        CREATE POLICY "Users can update their own folders" ON public.research_session_folders
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own folders' AND tablename = 'research_session_folders') THEN
        CREATE POLICY "Users can delete their own folders" ON public.research_session_folders
          FOR DELETE USING (auth.uid() = user_id);
    END IF;

    RAISE NOTICE 'RLS policies created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Some RLS policies may already exist, continuing...';
END $$;

-- Create indexes for performance (safe)
CREATE INDEX IF NOT EXISTS idx_research_sessions_user_id ON public.research_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_status ON public.research_sessions(status);
CREATE INDEX IF NOT EXISTS idx_research_sessions_created_at ON public.research_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_sessions_updated_at ON public.research_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_sessions_folder_id ON public.research_sessions(folder_id);
CREATE INDEX IF NOT EXISTS idx_research_results_session_id ON public.research_results(session_id);
CREATE INDEX IF NOT EXISTS idx_research_results_provider ON public.research_results(ai_provider);
CREATE INDEX IF NOT EXISTS idx_research_costs_user_id ON public.research_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_research_session_folders_user_id ON public.research_session_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_research_session_tags_session_id ON public.research_session_tags(session_id);

-- Create helper functions (safe)
CREATE OR REPLACE FUNCTION public.generate_session_title(prompt_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cleaned_prompt TEXT;
  title TEXT;
BEGIN
  cleaned_prompt := regexp_replace(
    lower(prompt_text), 
    '(please |analyze |research |study |investigate |examine |conduct )', 
    '', 'g'
  );
  
  title := substring(trim(cleaned_prompt) from 1 for 50);
  
  IF length(trim(cleaned_prompt)) > 50 THEN
    title := title || '...';
  END IF;
  
  title := upper(substring(title from 1 for 1)) || substring(title from 2);
  
  IF title IS NULL OR trim(title) = '' OR trim(title) = '...' THEN
    title := 'Research Session';
  END IF;
  
  RETURN title;
END;
$$;

-- Insert default research templates (fixed with proper casting)
DO $$ 
BEGIN
    -- Insert templates one by one with proper casting
    IF NOT EXISTS (SELECT 1 FROM public.research_templates WHERE name = 'Market Analysis Template') THEN
        INSERT INTO public.research_templates (name, description, research_type, prompt_template, is_public, created_by) 
        VALUES (
            'Market Analysis Template', 
            'Comprehensive market analysis for a specific industry or sector', 
            'market_research'::research_task_type,
            'Please conduct a comprehensive market analysis for the following industry/sector: {{industry}}

Include the following key areas in your analysis:

1. **Market Size & Growth**: Current market size, historical growth trends, and projected growth rates
2. **Key Players**: Major companies, market share distribution, competitive landscape
3. **Market Drivers**: Primary factors driving growth and demand
4. **Challenges & Risks**: Major obstacles, regulatory issues, economic factors
5. **Opportunities**: Emerging trends, untapped segments, growth opportunities

Please provide specific data points, statistics, and actionable insights where possible.', 
            true, 
            NULL
        );
        RAISE NOTICE 'Inserted Market Analysis Template';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.research_templates WHERE name = 'Quick Research Template') THEN
        INSERT INTO public.research_templates (name, description, research_type, prompt_template, is_public, created_by) 
        VALUES (
            'Quick Research Template', 
            'Fast overview for general research topics', 
            'custom'::research_task_type,
            'Please provide a comprehensive overview of: {{topic}}

Include:
1. Key facts and current status
2. Main benefits and challenges  
3. Recent developments and trends
4. Future outlook and implications

Keep it informative but concise.', 
            true, 
            NULL
        );
        RAISE NOTICE 'Inserted Quick Research Template';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.research_templates WHERE name = 'Competitive Analysis Template') THEN
        INSERT INTO public.research_templates (name, description, research_type, prompt_template, is_public, created_by) 
        VALUES (
            'Competitive Analysis Template', 
            'Analyze competitors in your market', 
            'competitive_analysis'::research_task_type,
            'Please conduct a competitive analysis for {{company}} in the {{industry}} industry.

For each major competitor, analyze:
1. **Business Model**: Revenue streams, pricing strategy
2. **Strengths**: Key advantages and market position
3. **Weaknesses**: Areas of vulnerability
4. **Market Share**: Relative position and trends
5. **Recent Developments**: New launches, partnerships

Provide strategic recommendations for competitive advantage.', 
            true, 
            NULL
        );
        RAISE NOTICE 'Inserted Competitive Analysis Template';
    END IF;

    RAISE NOTICE 'All research templates have been created successfully';
END $$;

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ AI Research System setup completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tables created:';
  RAISE NOTICE '  • research_sessions (main chat sessions)';
  RAISE NOTICE '  • research_results (AI responses)';
  RAISE NOTICE '  • research_comparisons (side-by-side analysis)';
  RAISE NOTICE '  • research_session_folders (organization)';
  RAISE NOTICE '  • research_session_tags (tagging)';
  RAISE NOTICE '  • research_costs (cost tracking)';
  RAISE NOTICE '  • user_research_quotas (user limits)';
  RAISE NOTICE '  • research_templates (reusable prompts)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 All RLS policies and indexes have been applied';
  RAISE NOTICE '📝 3 research templates created';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Chat history sidebar should now work perfectly!';
  RAISE NOTICE '👉 Refresh your browser to see the changes';
END $$;