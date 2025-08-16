-- Missing AI Research Features Migration
-- This adds the missing features that aren't in the existing migrations

-- Add 'grok' to ai_provider enum if not exists
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'grok' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ai_provider')
    ) THEN
        ALTER TYPE public.ai_provider ADD VALUE 'grok';
    END IF;
EXCEPTION
    WHEN others THEN
        -- If enum doesn't exist, create it
        CREATE TYPE public.ai_provider AS ENUM ('openai', 'claude', 'grok', 'parallel');
END $$;

-- Ensure all required columns exist in research_sessions
DO $$ BEGIN
    -- Add session_title if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'research_sessions' 
        AND column_name = 'session_title'
    ) THEN
        ALTER TABLE public.research_sessions ADD COLUMN session_title TEXT;
        
        -- Populate from title or prompt
        UPDATE public.research_sessions 
        SET session_title = COALESCE(
            NULLIF(title, ''),
            LEFT(research_prompt, 50) || CASE WHEN LENGTH(research_prompt) > 50 THEN '...' ELSE '' END,
            'Untitled Research'
        )
        WHERE session_title IS NULL;
        
        ALTER TABLE public.research_sessions 
        ALTER COLUMN session_title SET NOT NULL,
        ALTER COLUMN session_title SET DEFAULT 'Untitled Research';
    END IF;

    -- Add conversation_metadata if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'research_sessions' 
        AND column_name = 'conversation_metadata'
    ) THEN
        ALTER TABLE public.research_sessions ADD COLUMN conversation_metadata JSONB DEFAULT '{
            "message_count": 1,
            "last_activity": null,
            "tags": [],
            "favorite": false,
            "archived": false,
            "total_cost": 0,
            "provider_usage": {}
        }';
    END IF;

    -- Add folder_id if not exists (will be populated later after folders table)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'research_sessions' 
        AND column_name = 'folder_id'
    ) THEN
        ALTER TABLE public.research_sessions ADD COLUMN folder_id UUID;
    END IF;
END $$;

-- Create helper function to get enum values (for debugging)
CREATE OR REPLACE FUNCTION public.get_enum_values(enum_name TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    enum_values TEXT[];
BEGIN
    SELECT array_agg(enumlabel ORDER BY enumsortorder)
    INTO enum_values
    FROM pg_enum
    WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = enum_name
    );
    
    RETURN enum_values;
END;
$$;

-- Create function to generate session titles if not exists
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

-- Create function to update session metadata if not exists
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

-- Now add foreign key constraint for folder_id if folders table exists
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'research_session_folders') THEN
        -- Check if constraint already exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_research_sessions_folder_id'
        ) THEN
            ALTER TABLE public.research_sessions 
            ADD CONSTRAINT fk_research_sessions_folder_id 
            FOREIGN KEY (folder_id) REFERENCES public.research_session_folders(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Create additional helpful indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_research_sessions_session_title_gin 
ON public.research_sessions USING gin(to_tsvector('english', session_title));

CREATE INDEX IF NOT EXISTS idx_research_sessions_conversation_metadata_gin 
ON public.research_sessions USING gin(conversation_metadata);

-- Insert some default research templates if the table is empty
INSERT INTO public.research_templates (name, description, research_type, prompt_template, is_public, created_by) 
SELECT * FROM (VALUES
    (
        'Quick Market Overview', 
        'Fast overview of market conditions and trends', 
        'market_research',
        'Please provide a quick market overview for {{industry}}. Include: 1) Market size and growth, 2) Key players, 3) Main trends, 4) Opportunities and challenges. Keep it concise but informative.',
        true, 
        NULL
    ),
    (
        'Competitor Analysis', 
        'Analyze specific competitors in your industry', 
        'competitive_analysis',
        'Analyze these competitors: {{competitors}} in the {{industry}} market. For each, provide: 1) Business model, 2) Strengths and weaknesses, 3) Market position, 4) Recent developments. Include strategic recommendations.',
        true, 
        NULL
    ),
    (
        'Investment Research', 
        'Research investment opportunities and risks', 
        'investment_analysis',
        'Research {{investment_target}} as an investment opportunity. Analyze: 1) Financial performance, 2) Growth prospects, 3) Risk factors, 4) Competitive position, 5) Valuation. Provide investment recommendation.',
        true, 
        NULL
    )
) AS templates(name, description, research_type, prompt_template, is_public, created_by)
WHERE NOT EXISTS (SELECT 1 FROM public.research_templates LIMIT 1);

-- Final verification message
DO $$
BEGIN
  RAISE NOTICE 'Missing AI Research features have been added!';
  RAISE NOTICE 'Chat history functionality should now work properly.';
  RAISE NOTICE 'Grok AI provider support has been added.';
END $$;