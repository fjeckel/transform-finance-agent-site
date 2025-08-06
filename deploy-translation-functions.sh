#!/bin/bash

# Deploy Translation Functions with Secret Verification
# Usage: ./deploy-translation-functions.sh

echo "🤖 Deploying AI Translation Functions"
echo "===================================="

# Check prerequisites
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with: brew install supabase/tap/supabase"
    exit 1
fi

if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged into Supabase. Run: supabase login"
    exit 1
fi

echo "✅ Prerequisites met"

# Verify secrets before deployment
echo ""
echo "🔐 Verifying Required Secrets:"
echo "-----------------------------"

MISSING_SECRETS=()

if ! supabase secrets list | grep -q "OPENAI_API_KEY"; then
    echo "❌ OPENAI_API_KEY not found"
    MISSING_SECRETS+=("OPENAI_API_KEY")
else
    echo "✅ OPENAI_API_KEY configured"
fi

if ! supabase secrets list | grep -q "CLAUDE_API_KEY"; then
    echo "❌ CLAUDE_API_KEY not found"
    MISSING_SECRETS+=("CLAUDE_API_KEY")
else
    echo "✅ CLAUDE_API_KEY configured"
fi

# If secrets are missing, provide instructions
if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  Missing Secrets Detected!"
    echo "Please set the following secrets before deployment:"
    echo ""
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "supabase secrets set $secret=your_${secret,,}_here"
    done
    echo ""
    read -p "Do you want to continue with deployment anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled. Please set the required secrets first."
        exit 1
    fi
fi

# Deploy functions
FUNCTIONS=("debug-secrets" "translate-content" "translate-content-claude" "batch-translate")

echo ""
echo "🚀 Deploying Functions:"
echo "----------------------"

for func in "${FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        echo "📡 Deploying $func..."
        if supabase functions deploy $func; then
            echo "✅ $func deployed successfully"
        else
            echo "❌ $func deployment failed"
        fi
        echo ""
    else
        echo "⚠️  $func directory not found, skipping..."
    fi
done

# Test deployment with debug function
echo "🧪 Testing Deployment:"
echo "---------------------"

PROJECT_URL=$(supabase status | grep "API URL" | awk '{print $3}')

if [ ! -z "$PROJECT_URL" ]; then
    echo "Testing debug-secrets function..."
    
    # Get access token (this might not work in all setups)
    TOKEN=$(supabase auth login --print-access-token 2>/dev/null || echo "")
    
    if [ ! -z "$TOKEN" ]; then
        echo "📞 Calling debug function with authentication..."
        response=$(curl -s "${PROJECT_URL}/functions/v1/debug-secrets" \
                      -H "Authorization: Bearer $TOKEN" \
                      -H "Content-Type: application/json")
        
        if echo "$response" | jq . >/dev/null 2>&1; then
            echo "✅ Debug function responded successfully"
            echo "$response" | jq '.secrets_check'
        else
            echo "⚠️  Debug function response: $response"
        fi
    else
        echo "⚠️  Could not get access token for testing"
        echo "   You can test manually at: ${PROJECT_URL}/functions/v1/debug-secrets"
    fi
else
    echo "❌ Could not determine project URL"
fi

echo ""
echo "📋 Next Steps:"
echo "============="
echo "1. Check function logs if issues persist:"
echo "   supabase functions logs translate-content"
echo "   supabase functions logs translate-content-claude"
echo ""
echo "2. Test the debug function in your browser or API client:"
echo "   GET ${PROJECT_URL}/functions/v1/debug-secrets"
echo ""
echo "3. Test translation functions with proper authentication"
echo ""
echo "4. Monitor logs during testing:"
echo "   supabase functions logs --follow"

echo ""
echo "🎉 Deployment complete!"