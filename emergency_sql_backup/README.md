# Emergency SQL Files - Backup

This directory contains emergency SQL files that were created during RLS debugging sessions. These files have been moved here to clean up the root directory and prevent accidental execution.

## Files moved:
- `emergency_disable_rls.sql` - Completely disables RLS (dangerous)
- `fix_email_rls.sql` - Had incorrect admin email 
- `debug_insights.sql` - Debugging queries
- `EMERGENCY_FIX.sql` - Emergency RLS fixes
- `FIX_RLS_POLICIES.sql` - RLS policy fixes
- `FIXED_MIGRATION.sql` - Migration fixes

## Status:
These files are now **OBSOLETE** - replaced by the consolidated RLS migration:
`supabase/migrations/20250803000001_consolidate_rls_policies.sql`

## ⚠️ Warning:
Do NOT run these files as they contain conflicting policies and incorrect admin email addresses.