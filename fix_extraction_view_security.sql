-- Fix the existing extraction_with_translations view to use SECURITY INVOKER
-- This addresses the security vulnerability identified in the database linter

-- Option 1: Try to alter the existing view (PostgreSQL 15+)
-- If this fails, use Option 2 below
ALTER VIEW extraction_with_translations SET (security_invoker = true);

-- Option 2: If ALTER VIEW fails, drop and recreate with CASCADE
-- Uncomment the lines below if Option 1 doesn't work:

/*
DROP VIEW IF EXISTS extraction_with_translations CASCADE;

CREATE VIEW extraction_with_translations 
WITH (security_invoker = true) AS
SELECT 
    e.*,
    t.title_de,
    t.title_en,
    t.summary_de,
    t.summary_en,
    t.content_de,
    t.content_en
FROM extractions e
LEFT JOIN translations t ON e.id = t.source_id 
WHERE t.source_type = 'extraction';
*/