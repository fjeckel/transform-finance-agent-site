#!/bin/bash

# Deploy Supabase Edge Functions
# Run this locally to deploy functions directly

echo "🚀 Deploying Supabase Edge Functions..."

PROJECT_REF="aumijfxmeclxweojrefa"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Deploy functions one by one
echo "📡 Deploying RSS feed function..."
supabase functions deploy rss-feed --project-ref $PROJECT_REF

echo "🌐 Deploying translation functions..."
supabase functions deploy translate-content --project-ref $PROJECT_REF
supabase functions deploy translate-content-claude --project-ref $PROJECT_REF
supabase functions deploy batch-translate --project-ref $PROJECT_REF

echo "🔬 Deploying AI research functions..."
supabase functions deploy ai-research-claude --project-ref $PROJECT_REF
supabase functions deploy ai-research-openai --project-ref $PROJECT_REF
supabase functions deploy ai-research-parallel --project-ref $PROJECT_REF

echo "✅ All functions deployed!"
echo ""
echo "🔗 Functions are available at:"
echo "- https://$PROJECT_REF.supabase.co/functions/v1/ai-research-claude"
echo "- https://$PROJECT_REF.supabase.co/functions/v1/ai-research-openai"  
echo "- https://$PROJECT_REF.supabase.co/functions/v1/ai-research-parallel"
echo ""
echo "🧪 Test the Claude function:"
echo 'curl -X POST "https://'$PROJECT_REF'.supabase.co/functions/v1/ai-research-claude" \'
echo '  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"systemPrompt": "You are a helpful assistant", "userPrompt": "Hello!"}"'"