-- Fix RLS permissions for content extraction system
-- Run this in your Supabase SQL editor to fix the 403 errors

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can manage content extractions" ON content_extractions;
DROP POLICY IF EXISTS "Admin can manage AI results" ON extraction_ai_results;
DROP POLICY IF EXISTS "Admin can manage templates" ON extraction_templates;

-- Create more permissive policies for authenticated users
-- Note: Adjust these based on your security requirements

-- Allow authenticated users to manage content extractions
CREATE POLICY "Authenticated users can manage content extractions" ON content_extractions
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to view and manage AI results
CREATE POLICY "Authenticated users can manage AI results" ON extraction_ai_results
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to view templates
CREATE POLICY "Authenticated users can read templates" ON extraction_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow service role to manage templates (for seeding)
CREATE POLICY "Service role can manage templates" ON extraction_templates
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Ensure tables have proper permissions
GRANT ALL ON content_extractions TO authenticated;
GRANT ALL ON extraction_ai_results TO authenticated;
GRANT SELECT ON extraction_templates TO authenticated;
GRANT ALL ON extraction_templates TO service_role;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Success message
SELECT 'Content extraction permissions updated successfully! The 403 errors should be resolved.' AS status;