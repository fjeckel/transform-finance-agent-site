-- AI Research Comparator System Database Schema
-- Extends existing infrastructure for AI research functionality

-- Create enum for research session status
CREATE TYPE public.research_session_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'cancelled');

-- Create enum for research task types
CREATE TYPE public.research_task_type AS ENUM ('comparative_analysis', 'market_research', 'competitive_analysis', 'trend_analysis', 'risk_assessment', 'investment_analysis', 'custom');

-- Create enum for AI provider types
CREATE TYPE public.ai_provider AS ENUM ('openai', 'claude', 'parallel');

-- Create research sessions table
CREATE TABLE public.research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  research_type research_task_type NOT NULL DEFAULT 'custom',
  research_prompt TEXT NOT NULL,
  max_tokens INTEGER DEFAULT 4000,
  temperature DECIMAL(3,2) DEFAULT 0.3,
  status research_session_status DEFAULT 'pending',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  estimated_cost_usd DECIMAL(10,4) DEFAULT 0,
  actual_cost_usd DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create research results table for individual AI provider responses
CREATE TABLE public.research_results (
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
CREATE TABLE public.research_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.research_sessions(id) ON DELETE CASCADE NOT NULL,
  claude_result_id UUID REFERENCES public.research_results(id),
  openai_result_id UUID REFERENCES public.research_results(id),
  comparison_notes TEXT,
  preference_rating INTEGER CHECK (preference_rating BETWEEN -5 AND 5), -- -5 (strongly prefer OpenAI) to 5 (strongly prefer Claude)
  quality_scores JSONB DEFAULT '{"claude": null, "openai": null, "overall": null}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cost tracking table for budget management
CREATE TABLE public.research_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.research_sessions(id) ON DELETE CASCADE,
  ai_provider ai_provider NOT NULL,
  model_name TEXT NOT NULL,
  operation_type TEXT NOT NULL DEFAULT 'research', -- 'research', 'translation', etc.
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,4) NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user quota management table
CREATE TABLE public.user_research_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  monthly_token_limit INTEGER DEFAULT 100000, -- 100K tokens per month default
  monthly_cost_limit_usd DECIMAL(8,2) DEFAULT 50.00, -- $50 per month default
  tokens_used_this_month INTEGER DEFAULT 0,
  cost_spent_this_month DECIMAL(8,2) DEFAULT 0,
  current_period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  current_period_end DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
  quota_reset_day INTEGER DEFAULT 1, -- Day of month to reset quota
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create research templates for common use cases
CREATE TABLE public.research_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  research_type research_task_type NOT NULL,
  prompt_template TEXT NOT NULL,
  suggested_max_tokens INTEGER DEFAULT 4000,
  suggested_temperature DECIMAL(3,2) DEFAULT 0.3,
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create template ratings for community feedback
CREATE TABLE public.template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.research_templates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_research_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_ratings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for research sessions
CREATE POLICY "Users can view their own research sessions" ON public.research_sessions
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own research sessions" ON public.research_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own research sessions" ON public.research_sessions
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own research sessions" ON public.research_sessions
  FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Create RLS policies for research results
CREATE POLICY "Users can view results for their sessions" ON public.research_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.research_sessions 
      WHERE research_sessions.id = research_results.session_id 
      AND (research_sessions.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "System can insert research results" ON public.research_results
  FOR INSERT WITH CHECK (true); -- Edge functions need to insert results

CREATE POLICY "System can update research results" ON public.research_results
  FOR UPDATE USING (true); -- Edge functions need to update results

-- Create RLS policies for research comparisons
CREATE POLICY "Users can view comparisons for their sessions" ON public.research_comparisons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.research_sessions 
      WHERE research_sessions.id = research_comparisons.session_id 
      AND (research_sessions.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
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

-- Create RLS policies for research costs
CREATE POLICY "Users can view their own costs" ON public.research_costs
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert cost records" ON public.research_costs
  FOR INSERT WITH CHECK (true); -- Edge functions need to track costs

-- Create RLS policies for user quotas
CREATE POLICY "Users can view their own quotas" ON public.user_research_quotas
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own quotas" ON public.user_research_quotas
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Create RLS policies for research templates
CREATE POLICY "Anyone can view public templates" ON public.research_templates
  FOR SELECT USING (is_public = true OR auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create templates" ON public.research_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates" ON public.research_templates
  FOR UPDATE USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- Create RLS policies for template ratings
CREATE POLICY "Users can view all template ratings" ON public.template_ratings
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Users can rate templates" ON public.template_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON public.template_ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_research_sessions_user_id ON public.research_sessions(user_id);
CREATE INDEX idx_research_sessions_status ON public.research_sessions(status);
CREATE INDEX idx_research_sessions_created_at ON public.research_sessions(created_at DESC);
CREATE INDEX idx_research_results_session_id ON public.research_results(session_id);
CREATE INDEX idx_research_results_provider ON public.research_results(ai_provider);
CREATE INDEX idx_research_comparisons_session_id ON public.research_comparisons(session_id);
CREATE INDEX idx_research_costs_user_id ON public.research_costs(user_id);
CREATE INDEX idx_research_costs_billing_period ON public.research_costs(billing_period_start, billing_period_end);
CREATE INDEX idx_user_quotas_user_id ON public.user_research_quotas(user_id);
CREATE INDEX idx_templates_type ON public.research_templates(research_type);
CREATE INDEX idx_templates_public ON public.research_templates(is_public);
CREATE INDEX idx_template_ratings_template_id ON public.template_ratings(template_id);

-- Create function to automatically create user quota on profile creation
CREATE OR REPLACE FUNCTION public.create_user_research_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_research_quotas (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create quota for new users
CREATE TRIGGER on_profile_created_create_quota
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_user_research_quota();

-- Create function to reset monthly quotas
CREATE OR REPLACE FUNCTION public.reset_monthly_research_quotas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_research_quotas
  SET 
    tokens_used_this_month = 0,
    cost_spent_this_month = 0,
    current_period_start = CURRENT_DATE,
    current_period_end = CURRENT_DATE + INTERVAL '1 month',
    updated_at = NOW()
  WHERE current_period_end <= CURRENT_DATE;
END;
$$;

-- Create function to update quota usage
CREATE OR REPLACE FUNCTION public.update_research_quota_usage(
  p_user_id UUID,
  p_tokens_used INTEGER,
  p_cost_spent DECIMAL(8,2)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_tokens INTEGER;
  current_cost DECIMAL(8,2);
  token_limit INTEGER;
  cost_limit DECIMAL(8,2);
BEGIN
  -- Get current usage and limits
  SELECT 
    tokens_used_this_month, 
    cost_spent_this_month,
    monthly_token_limit,
    monthly_cost_limit_usd
  INTO current_tokens, current_cost, token_limit, cost_limit
  FROM public.user_research_quotas
  WHERE user_id = p_user_id;
  
  -- Check if adding usage would exceed limits
  IF (current_tokens + p_tokens_used) > token_limit OR 
     (current_cost + p_cost_spent) > cost_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Update usage
  UPDATE public.user_research_quotas
  SET 
    tokens_used_this_month = tokens_used_this_month + p_tokens_used,
    cost_spent_this_month = cost_spent_this_month + p_cost_spent,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$;

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
true, NULL),

('Trend Analysis Template', 'Analysis of emerging trends and their business implications', 'trend_analysis',
'Please analyze the following trend and its business implications: {{trend_topic}}

**Trend Analysis Framework**:

1. **Trend Definition**: Clear description of the trend and its key characteristics
2. **Current State**: Where the trend stands today, adoption levels, market maturity
3. **Growth Trajectory**: How the trend is evolving, growth metrics, timeline
4. **Driving Forces**: What factors are propelling this trend forward

**Market Impact**:
1. **Industries Affected**: Which sectors are most impacted
2. **Business Models**: How companies are adapting or emerging around this trend
3. **Consumer Behavior**: Changes in customer expectations and behaviors
4. **Value Chain Impact**: Effects on suppliers, distributors, end users

**Investment & Business Opportunities**:
1. **Direct Opportunities**: Companies/technologies riding this trend
2. **Indirect Opportunities**: Supporting industries and services
3. **Disruption Risks**: Traditional players facing obsolescence
4. **Market Timing**: Is this trend early, maturing, or peaking?

**Strategic Implications**:
- How businesses should respond
- Investment considerations
- Risk mitigation strategies
- Long-term strategic positioning

**Future Outlook**: 3-5 year projection of trend evolution and business impact

Provide concrete examples and actionable insights for business decision-makers.', 
true, NULL);

-- Add helpful comments
COMMENT ON TABLE public.research_sessions IS 'User research sessions with AI providers';
COMMENT ON TABLE public.research_results IS 'Individual AI provider responses for each session';
COMMENT ON TABLE public.research_comparisons IS 'Side-by-side comparisons between Claude and OpenAI results';
COMMENT ON TABLE public.research_costs IS 'Detailed cost tracking for all AI operations';
COMMENT ON TABLE public.user_research_quotas IS 'User quota management and billing limits';
COMMENT ON TABLE public.research_templates IS 'Reusable research prompt templates';
COMMENT ON TABLE public.template_ratings IS 'Community ratings for research templates';