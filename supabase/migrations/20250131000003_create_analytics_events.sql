-- Create analytics_events table for tracking user interactions
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_events_event_data_gin ON public.analytics_events USING gin(event_data);

-- RLS policies for analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow inserting analytics events for anyone (anonymous or authenticated)
CREATE POLICY "Allow analytics event insertion" ON public.analytics_events 
FOR INSERT 
WITH CHECK (true);

-- Policy: Users can read their own analytics events
CREATE POLICY "Users can read own analytics events" ON public.analytics_events 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Admins can read all analytics events
CREATE POLICY "Admins can read all analytics events" ON public.analytics_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Create a view for analytics insights
CREATE VIEW public.analytics_insights AS
SELECT 
  event_type,
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  event_data
FROM public.analytics_events
GROUP BY event_type, DATE_TRUNC('day', created_at), event_data;

-- Grant necessary permissions
GRANT SELECT ON public.analytics_insights TO authenticated;
GRANT SELECT ON public.analytics_insights TO anon;