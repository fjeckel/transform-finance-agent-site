# AI Research System Database Setup Instructions

## Setup Status

The AI Research system database tables already exist from previous migrations, but some chat history features may be missing. Here's how to complete the setup:

## Option 1: Supabase SQL Editor (Recommended)

1. **Go to Supabase SQL Editor**:
   - Open: https://supabase.com/dashboard/project/aumijfxmeclxweojrefa/sql

2. **Apply Missing Features**:
   - Copy the contents of `missing-features.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute

3. **Verify Setup**:
   - Run the verification queries below

## Option 2: Manual Verification

Run this verification script to check what's already set up:

```bash
node check-database.js
```

## Verification Queries

Run these in the Supabase SQL Editor to verify everything is working:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'research_%'
ORDER BY table_name;

-- Check AI provider enum values
SELECT unnest(enum_range(NULL::ai_provider)) as provider;

-- Check if chat history columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'research_sessions' 
AND column_name IN ('session_title', 'conversation_metadata', 'folder_id');

-- Check if helper functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('generate_session_title', 'update_session_metadata', 'get_enum_values');

-- Count template records
SELECT COUNT(*) as template_count FROM research_templates;
```

## Expected Results

After successful setup, you should see:

✅ **Tables**: All 8 research-related tables exist
✅ **AI Providers**: 'openai', 'claude', 'grok', 'parallel'
✅ **Chat History**: session_title, conversation_metadata, folder_id columns
✅ **Functions**: Helper functions for session management
✅ **Templates**: At least 3 default research templates

## Testing the Setup

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Navigate to AI Research**:
   - Go to `/admin/ai-research` in your browser
   - You should see the chat history sidebar
   - Try creating a new research session

3. **Verify chat history**:
   - Sessions should appear in the sidebar
   - Folder organization should work
   - Session titles should be auto-generated

## Troubleshooting

### If tables don't exist:
- The original migrations may not have been applied
- Run the complete setup: Copy `COMPLETE_AI_RESEARCH_SETUP.sql` to SQL Editor

### If chat history doesn't work:
- Check browser console for errors
- Verify RLS policies allow access
- Ensure user is authenticated

### If Grok provider is missing:
- Run just the enum update part of `missing-features.sql`

## Files Created

- `check-database.js` - Verification script
- `missing-features.sql` - Adds missing chat history features  
- `COMPLETE_AI_RESEARCH_SETUP.sql` - Complete system setup (if needed)
- `setup-database.js` - Automated setup script (requires service key)

## API Access

The AI Research system uses these endpoints:
- `/functions/v1/ai-research-claude` - Claude AI research
- `/functions/v1/ai-research-openai` - OpenAI research  
- `/functions/v1/ai-research-grok` - Grok AI research
- `/functions/v1/ai-research-parallel` - Parallel research

All endpoints are already deployed and configured.

## Success Indicators

✅ Chat history sidebar loads without errors
✅ Can create new research sessions
✅ Sessions appear in sidebar with proper titles
✅ Can organize sessions into folders
✅ Can toggle favorites and manage sessions
✅ Cost tracking and quotas work properly

The AI Research system should now be fully operational!