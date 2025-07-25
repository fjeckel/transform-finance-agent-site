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

# Deploy all functions
FUNCTIONS=("rss-feed" "stripe-create-checkout-session" "stripe-webhook" "download-pdf" "stripe-create-payment-intent")

for func in "${FUNCTIONS[@]}"; do
    echo "📡 Deploying $func function..."
    supabase functions deploy $func
    
    if [ $? -eq 0 ]; then
        echo "✅ $func function deployed successfully!"
    else
        echo "❌ $func deployment failed. Continuing with other functions..."
    fi
    echo ""
done

echo "📋 Your RSS feeds are now available at:"
echo "   - All episodes: [PROJECT_URL]/functions/v1/rss-feed"
echo "   - WTF: [PROJECT_URL]/functions/v1/rss-feed/wtf"
echo "   - Finance Transformers: [PROJECT_URL]/functions/v1/rss-feed/finance_transformers"
echo "   - CFO Memo: [PROJECT_URL]/functions/v1/rss-feed/cfo_memo"
echo ""
echo "💳 Stripe payment functions deployed:"
echo "   - Checkout session creation: [PROJECT_URL]/functions/v1/stripe-create-checkout-session"
echo "   - Webhook handler: [PROJECT_URL]/functions/v1/stripe-webhook"
echo "   - PDF download: [PROJECT_URL]/functions/v1/download-pdf"

# List all deployed functions
echo ""
echo "📋 Currently deployed functions:"
supabase functions list