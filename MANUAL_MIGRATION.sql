-- MANUAL MIGRATION FOR PRODUCTION
-- Run this SQL in Supabase SQL Editor to enable chat history features
-- URL: https://supabase.com/dashboard/project/aumijfxmeclxweojrefa/sql

-- Add chat history columns to research_sessions table
ALTER TABLE public.research_sessions ADD COLUMN IF NOT EXISTS session_title TEXT;
ALTER TABLE public.research_sessions ADD COLUMN IF NOT EXISTS conversation_metadata JSONB DEFAULT '{
  "message_count": 0,
  "last_activity": null,
  "tags": [],
  "favorite": false,
  "archived": false,
  "total_cost": 0,
  "provider_usage": {}
}';

-- Update existing sessions with session titles
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

-- Set NOT NULL constraint
ALTER TABLE public.research_sessions 
ALTER COLUMN session_title SET DEFAULT 'Untitled Research';
ALTER TABLE public.research_sessions 
ALTER COLUMN session_title SET NOT NULL;

-- Create session folders table
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
ALTER TABLE public.research_sessions ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.research_session_folders(id) ON DELETE SET NULL;

-- Create session tags table
CREATE TABLE IF NOT EXISTS public.research_session_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.research_sessions(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, tag)
);

-- Enable RLS
ALTER TABLE public.research_session_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_session_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for folders
CREATE POLICY "Users can view their own folders" ON public.research_session_folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders" ON public.research_session_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON public.research_session_folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON public.research_session_folders
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for tags
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_research_sessions_session_title ON public.research_sessions USING gin(to_tsvector('english', session_title));
CREATE INDEX IF NOT EXISTS idx_research_sessions_folder_id ON public.research_sessions(folder_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_conversation_metadata ON public.research_sessions USING gin(conversation_metadata);
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