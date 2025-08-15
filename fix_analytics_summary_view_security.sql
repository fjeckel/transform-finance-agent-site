-- Fix the start_here_analytics_summary view security property
-- This addresses the final security vulnerability identified in the database linter

-- Option 1: Try to alter the existing view (PostgreSQL 15+)
ALTER VIEW start_here_analytics_summary SET (security_invoker = true);

-- Option 2: If ALTER VIEW fails, drop and recreate
-- Uncomment the lines below if Option 1 doesn't work:

/*
DROP VIEW IF EXISTS start_here_analytics_summary CASCADE;

CREATE VIEW start_here_analytics_summary 
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
*/