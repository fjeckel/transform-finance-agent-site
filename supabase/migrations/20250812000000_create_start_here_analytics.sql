-- Create start_here_analytics table for tracking user journey and conversion metrics
CREATE TABLE IF NOT EXISTS start_here_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'section_viewed',
    'path_card_hovered',
    'path_selected',
    'journey_started',
    'step_completed',
    'step_skipped',
    'journey_completed',
    'journey_abandoned',
    'email_captured',
    'episode_played',
    'content_downloaded',
    'recommendation_clicked',
    'social_proof_clicked',
    'trust_signal_viewed'
  )),
  event_data JSONB NOT NULL DEFAULT '{}',
  path_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  user_agent TEXT,
  referrer TEXT,
  page_url TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create start_here_user_preferences table for storing user journey responses
CREATE TABLE IF NOT EXISTS start_here_user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  selected_path TEXT,
  goals TEXT[] DEFAULT '{}',
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  role TEXT,
  company_size TEXT CHECK (company_size IN ('startup', 'scaleup', 'enterprise', 'consulting')),
  industry TEXT,
  time_commitment TEXT CHECK (time_commitment IN ('light', 'moderate', 'intensive')),
  preferred_content_types TEXT[] DEFAULT '{}',
  learning_style TEXT CHECK (learning_style IN ('audio', 'reading', 'mixed')),
  primary_challenges TEXT[] DEFAULT '{}',
  completed_content TEXT[] DEFAULT '{}',
  bookmarked_content TEXT[] DEFAULT '{}',
  email_captured BOOLEAN DEFAULT FALSE,
  newsletter_subscribed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_start_here_analytics_event_type ON start_here_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_start_here_analytics_path_id ON start_here_analytics(path_id);
CREATE INDEX IF NOT EXISTS idx_start_here_analytics_user_id ON start_here_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_start_here_analytics_session_id ON start_here_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_start_here_analytics_timestamp ON start_here_analytics(timestamp);

CREATE INDEX IF NOT EXISTS idx_start_here_preferences_user_id ON start_here_user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_start_here_preferences_session_id ON start_here_user_preferences(session_id);
CREATE INDEX IF NOT EXISTS idx_start_here_preferences_path ON start_here_user_preferences(selected_path);
CREATE INDEX IF NOT EXISTS idx_start_here_preferences_updated ON start_here_user_preferences(updated_at);

-- Enable RLS (Row Level Security)
ALTER TABLE start_here_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE start_here_user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for start_here_analytics
-- Allow all users to insert analytics events (for anonymous tracking)
CREATE POLICY "Allow insert for all users" ON start_here_analytics
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Allow users to view their own analytics data
CREATE POLICY "Users can view own analytics" ON start_here_analytics
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Allow service role to access all analytics data
CREATE POLICY "Service role full access analytics" ON start_here_analytics
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- RLS Policies for start_here_user_preferences
-- Allow users to insert/update their own preferences
CREATE POLICY "Users can manage own preferences" ON start_here_user_preferences
    FOR ALL TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow anonymous users to insert preferences (for email capture before signup)
CREATE POLICY "Allow anonymous preferences insert" ON start_here_user_preferences
    FOR INSERT TO anon
    WITH CHECK (user_id IS NULL);

-- Allow service role to access all preferences data
CREATE POLICY "Service role full access preferences" ON start_here_user_preferences
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_start_here_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_start_here_preferences_updated_at_trigger
    BEFORE UPDATE ON start_here_user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_start_here_preferences_updated_at();

-- Create a view for analytics aggregation (useful for dashboards)
-- SECURITY INVOKER ensures the view respects RLS policies
CREATE OR REPLACE VIEW start_here_analytics_summary 
WITH (security_invoker = true) AS
SELECT 
    event_type,
    path_id,
    DATE_TRUNC('day', timestamp) as date,
    COUNT(*) as event_count,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT user_id) as unique_users
FROM start_here_analytics
GROUP BY event_type, path_id, DATE_TRUNC('day', timestamp)
ORDER BY date DESC, event_count DESC;