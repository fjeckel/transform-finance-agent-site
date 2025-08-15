-- AI Research Chat History Support Migration
-- Created: 2025-08-14
-- Purpose: Add chat history functionality to AI Research Comparator

-- Add chat history support to existing research_sessions table
ALTER TABLE public.research_sessions ADD COLUMN IF NOT EXISTS
  session_title TEXT;

-- Add conversation metadata for chat-like features
ALTER TABLE public.research_sessions ADD COLUMN IF NOT EXISTS
  conversation_metadata JSONB DEFAULT '{
    "message_count": 0,
    "last_activity": null,
    "tags": [],
    "favorite": false,
    "archived": false,
    "total_cost": 0,
    "provider_usage": {}
  }';

-- Add auto-generated session title if not provided
UPDATE public.research_sessions 
SET session_title = CASE 
  WHEN title IS NOT NULL AND title != '' THEN title
  WHEN research_prompt IS NOT NULL THEN 
    LEFT(research_prompt, 50) || CASE 
      WHEN LENGTH(research_prompt) > 50 THEN '...' 
      ELSE '' 
    END
  ELSE 'Untitled Research'
END
WHERE session_title IS NULL;

-- Make session_title NOT NULL with default
ALTER TABLE public.research_sessions 
ALTER COLUMN session_title SET DEFAULT 'Untitled Research',
ALTER COLUMN session_title SET NOT NULL;

-- Create session folders for organization
CREATE TABLE IF NOT EXISTS public.research_session_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
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

-- Add folder reference to sessions
ALTER TABLE public.research_sessions ADD COLUMN IF NOT EXISTS
  folder_id UUID REFERENCES public.research_session_folders(id) ON DELETE SET NULL;

-- Create session tags for better organization
CREATE TABLE IF NOT EXISTS public.research_session_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.research_sessions(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, tag)
);

-- Enable RLS on new tables
ALTER TABLE public.research_session_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_session_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for folders
CREATE POLICY "Users can view their own folders" ON public.research_session_folders
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own folders" ON public.research_session_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON public.research_session_folders
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own folders" ON public.research_session_folders
  FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- RLS policies for tags
CREATE POLICY "Users can view tags for their sessions" ON public.research_session_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.research_sessions 
      WHERE research_sessions.id = research_session_tags.session_id 
      AND (research_sessions.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_sessions_session_title ON public.research_sessions USING gin(to_tsvector('english', session_title));
CREATE INDEX IF NOT EXISTS idx_research_sessions_folder_id ON public.research_sessions(folder_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_conversation_metadata ON public.research_sessions USING gin(conversation_metadata);
CREATE INDEX IF NOT EXISTS idx_research_session_folders_user_id ON public.research_session_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_research_session_tags_session_id ON public.research_session_tags(session_id);
CREATE INDEX IF NOT EXISTS idx_research_session_tags_tag ON public.research_session_tags(tag);

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

-- Trigger to maintain folder session counts
CREATE TRIGGER update_folder_session_count_trigger
  AFTER UPDATE OF folder_id ON public.research_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_folder_session_count();

-- Function to generate smart session titles
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

-- Function to update conversation metadata
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

-- Create default folders for existing users
INSERT INTO public.research_session_folders (user_id, name, color, icon, sort_order)
SELECT DISTINCT 
  user_id,
  'General Research' as name,
  '#3B82F6' as color,
  'folder' as icon,
  0 as sort_order
FROM public.research_sessions rs
WHERE NOT EXISTS (
  SELECT 1 FROM public.research_session_folders rsf 
  WHERE rsf.user_id = rs.user_id
)
ON CONFLICT (user_id, name) DO NOTHING;

-- Update session counts for existing folders
UPDATE public.research_session_folders
SET session_count = (
  SELECT COUNT(*) FROM public.research_sessions 
  WHERE folder_id = research_session_folders.id
);

-- Add helpful comments
COMMENT ON TABLE public.research_session_folders IS 'Folders for organizing research sessions (like ChatGPT folders)';
COMMENT ON TABLE public.research_session_tags IS 'Tags for research sessions for better searchability';
COMMENT ON COLUMN public.research_sessions.session_title IS 'Display title for the session (auto-generated from prompt if not provided)';
COMMENT ON COLUMN public.research_sessions.conversation_metadata IS 'Chat-like metadata including message count, last activity, favorites, etc.';
COMMENT ON FUNCTION public.generate_session_title(TEXT) IS 'Generates intelligent session titles from research prompts';
COMMENT ON FUNCTION public.update_session_metadata(UUID, DECIMAL, TEXT) IS 'Updates session metadata for chat-like tracking';