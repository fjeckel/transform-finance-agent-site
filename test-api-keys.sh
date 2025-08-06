#!/bin/bash

# Test API Keys Functionality
# This script tests OpenAI and Claude API keys directly

echo "🔑 API Keys Functionality Test"
echo "=============================="

# Function to test OpenAI API key
test_openai_key() {
    local api_key="$1"
    echo "Testing OpenAI API key..."
    
    if [ -z "$api_key" ]; then
        echo "❌ OpenAI API key not provided"
        return 1
    fi
    
    # Test with a simple models list request
    response=$(curl -s -w "%{http_code}" \
        -H "Authorization: Bearer $api_key" \
        -H "Content-Type: application/json" \
        "https://api.openai.com/v1/models" \
        -o /tmp/openai_test.json)
    
    http_code="${response: -3}"
    
    if [ "$http_code" -eq 200 ]; then
        echo "✅ OpenAI API key is valid"
        model_count=$(jq '.data | length' /tmp/openai_test.json 2>/dev/null || echo "unknown")
        echo "   Available models: $model_count"
        return 0
    else
        echo "❌ OpenAI API key test failed (HTTP $http_code)"
        if [ -f /tmp/openai_test.json ]; then
            echo "   Error: $(cat /tmp/openai_test.json | jq -r '.error.message // "Unknown error"' 2>/dev/null || cat /tmp/openai_test.json)"
        fi
        return 1
    fi
}

# Function to test Claude API key
test_claude_key() {
    local api_key="$1"
    echo "Testing Claude API key..."
    
    if [ -z "$api_key" ]; then
        echo "❌ Claude API key not provided"
        return 1
    fi
    
    # Test with a simple messages request
    test_payload='{
        "model": "claude-3-5-haiku-20241022",
        "max_tokens": 10,
        "messages": [{"role": "user", "content": "Hello"}]
    }'
    
    response=$(curl -s -w "%{http_code}" \
        -X POST \
        -H "x-api-key: $api_key" \
        -H "Content-Type: application/json" \
        -H "anthropic-version: 2023-06-01" \
        -d "$test_payload" \
        "https://api.anthropic.com/v1/messages" \
        -o /tmp/claude_test.json)
    
    http_code="${response: -3}"
    
    if [ "$http_code" -eq 200 ]; then
        echo "✅ Claude API key is valid"
        usage=$(jq -r '.usage.input_tokens // "unknown"' /tmp/claude_test.json 2>/dev/null)
        echo "   Test successful (used $usage input tokens)"
        return 0
    else
        echo "❌ Claude API key test failed (HTTP $http_code)"
        if [ -f /tmp/claude_test.json ]; then
            echo "   Error: $(cat /tmp/claude_test.json | jq -r '.error.message // "Unknown error"' 2>/dev/null || cat /tmp/claude_test.json)"
        fi
        return 1
    fi
}

# Get API keys from Supabase secrets or environment
echo "🔍 Retrieving API keys..."

if command -v supabase &> /dev/null && supabase projects list &> /dev/null 2>&1; then
    echo "Getting keys from Supabase secrets..."
    
    # This won't work directly as secrets aren't exposed in CLI
    # But we can check if they exist
    if supabase secrets list | grep -q "OPENAI_API_KEY"; then
        echo "✅ OPENAI_API_KEY found in Supabase secrets"
        OPENAI_KEY_EXISTS=true
    else
        echo "❌ OPENAI_API_KEY not found in Supabase secrets"
        OPENAI_KEY_EXISTS=false
    fi
    
    if supabase secrets list | grep -q "CLAUDE_API_KEY"; then
        echo "✅ CLAUDE_API_KEY found in Supabase secrets"
        CLAUDE_KEY_EXISTS=true
    else
        echo "❌ CLAUDE_API_KEY not found in Supabase secrets"
        CLAUDE_KEY_EXISTS=false
    fi
else
    echo "⚠️  Supabase CLI not available or not logged in"
    OPENAI_KEY_EXISTS=false
    CLAUDE_KEY_EXISTS=false
fi

# Check environment variables as fallback
if [ -z "$OPENAI_API_KEY" ] && [ "$OPENAI_KEY_EXISTS" = false ]; then
    echo ""
    echo "⚠️  OpenAI API key not found in Supabase secrets or environment"
    echo "Please provide your OpenAI API key for testing:"
    read -s -p "OpenAI API Key (sk-proj-...): " OPENAI_API_KEY
    echo ""
fi

if [ -z "$CLAUDE_API_KEY" ] && [ "$CLAUDE_KEY_EXISTS" = false ]; then
    echo ""
    echo "⚠️  Claude API key not found in Supabase secrets or environment"
    echo "Please provide your Claude API key for testing:"
    read -s -p "Claude API Key (sk-ant-...): " CLAUDE_API_KEY
    echo ""
fi

# Run tests
echo ""
echo "🧪 Running API Tests:"
echo "--------------------"

OPENAI_SUCCESS=false
CLAUDE_SUCCESS=false

if [ ! -z "$OPENAI_API_KEY" ]; then
    if test_openai_key "$OPENAI_API_KEY"; then
        OPENAI_SUCCESS=true
    fi
else
    echo "⏭️  Skipping OpenAI test (no key provided)"
fi

echo ""

if [ ! -z "$CLAUDE_API_KEY" ]; then
    if test_claude_key "$CLAUDE_API_KEY"; then
        CLAUDE_SUCCESS=true
    fi
else
    echo "⏭️  Skipping Claude test (no key provided)"
fi

# Summary
echo ""
echo "📊 Test Summary:"
echo "==============="

if [ "$OPENAI_SUCCESS" = true ]; then
    echo "✅ OpenAI API: Working"
else
    echo "❌ OpenAI API: Failed or not tested"
fi

if [ "$CLAUDE_SUCCESS" = true ]; then
    echo "✅ Claude API: Working"
else
    echo "❌ Claude API: Failed or not tested"
fi

# Cleanup
rm -f /tmp/openai_test.json /tmp/claude_test.json

echo ""
echo "💡 Next Steps:"
echo "============="

if [ "$OPENAI_SUCCESS" = false ] && [ "$OPENAI_KEY_EXISTS" = false ]; then
    echo "1. Set OpenAI API key in Supabase:"
    echo "   supabase secrets set OPENAI_API_KEY=your_openai_key_here"
fi

if [ "$CLAUDE_SUCCESS" = false ] && [ "$CLAUDE_KEY_EXISTS" = false ]; then
    echo "2. Set Claude API key in Supabase:"
    echo "   supabase secrets set CLAUDE_API_KEY=your_claude_key_here"
fi

if [ "$OPENAI_SUCCESS" = true ] || [ "$CLAUDE_SUCCESS" = true ]; then
    echo "3. Deploy your translation functions:"
    echo "   ./deploy-translation-functions.sh"
    echo ""
    echo "4. Test the deployed functions with the debug endpoint"
fi

echo ""
echo "🎯 If API keys work here but fail in Supabase functions:"
echo "- Check that secrets are properly set with: supabase secrets list"
echo "- Redeploy functions after setting secrets"
echo "- Check function logs: supabase functions logs translate-content"