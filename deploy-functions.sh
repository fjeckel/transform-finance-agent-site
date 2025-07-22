#!/bin/bash

# Deploy Supabase Edge Functions
# Usage: ./deploy-functions.sh

echo "🚀 Deploying Supabase Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

# Check if logged in
if ! supabase db list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

# Deploy RSS Feed function
echo "📡 Deploying RSS Feed function..."
supabase functions deploy rss-feed

if [ $? -eq 0 ]; then
    echo "✅ RSS Feed function deployed successfully!"
    echo ""
    echo "📋 Your RSS feeds are now available at:"
    echo "   - All episodes: [PROJECT_URL]/functions/v1/rss-feed"
    echo "   - WTF: [PROJECT_URL]/functions/v1/rss-feed/wtf"
    echo "   - Finance Transformers: [PROJECT_URL]/functions/v1/rss-feed/finance_transformers"
    echo "   - CFO Memo: [PROJECT_URL]/functions/v1/rss-feed/cfo_memo"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi

# List all deployed functions
echo ""
echo "📋 Currently deployed functions:"
supabase functions list