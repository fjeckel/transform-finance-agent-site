#!/bin/bash

# Comprehensive Supabase Secrets Diagnostic Script
# This script systematically troubleshoots API key access issues in edge functions

set -e

echo "🔍 SUPABASE SECRETS DIAGNOSTIC TOOL"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get project info
PROJECT_REF="aumijfxmeclxweojrefa"
PROJECT_URL="https://${PROJECT_REF}.supabase.co"

echo -e "${BLUE}📋 PHASE 1: Environment Verification${NC}"
echo "-----------------------------------"

# Check if Supabase CLI is installed and logged in
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Please install: https://supabase.com/docs/guides/cli${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"

# Check if logged in
if ! supabase status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Supabase. Attempting login...${NC}"
    supabase login
fi

echo -e "${GREEN}✅ Supabase CLI authenticated${NC}"

# Verify project connection
echo ""
echo -e "${BLUE}📡 PHASE 2: Project Connection${NC}"
echo "----------------------------"

echo "Project Reference: ${PROJECT_REF}"
echo "Project URL: ${PROJECT_URL}"

# Check project status
if supabase projects list | grep -q "${PROJECT_REF}"; then
    echo -e "${GREEN}✅ Project found in account${NC}"
else
    echo -e "${RED}❌ Project not found in account. Please check project reference.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔐 PHASE 3: Secret Configuration Analysis${NC}"
echo "----------------------------------------"

# List current secrets
echo "Current secrets in project:"
supabase secrets list --project-ref "${PROJECT_REF}" || {
    echo -e "${RED}❌ Failed to list secrets${NC}"
    exit 1
}

echo ""
echo "Checking for specific API keys..."

# Check for OpenAI key
if supabase secrets list --project-ref "${PROJECT_REF}" | grep -q "openai-api-key"; then
    echo -e "${GREEN}✅ OpenAI API key found (as 'openai-api-key')${NC}"
    OPENAI_KEY_NAME="openai-api-key"
elif supabase secrets list --project-ref "${PROJECT_REF}" | grep -q "OPENAI_API_KEY"; then
    echo -e "${GREEN}✅ OpenAI API key found (as 'OPENAI_API_KEY')${NC}"
    OPENAI_KEY_NAME="OPENAI_API_KEY"
else
    echo -e "${RED}❌ OpenAI API key not found${NC}"
    OPENAI_KEY_NAME="missing"
fi

# Check for Claude key
if supabase secrets list --project-ref "${PROJECT_REF}" | grep -q "claude-api-key"; then
    echo -e "${GREEN}✅ Claude API key found (as 'claude-api-key')${NC}"
    CLAUDE_KEY_NAME="claude-api-key"
elif supabase secrets list --project-ref "${PROJECT_REF}" | grep -q "CLAUDE_API_KEY"; then
    echo -e "${GREEN}✅ Claude API key found (as 'CLAUDE_API_KEY')${NC}"
    CLAUDE_KEY_NAME="CLAUDE_API_KEY"
else
    echo -e "${RED}❌ Claude API key not found${NC}"
    CLAUDE_KEY_NAME="missing"
fi

echo ""
echo -e "${BLUE}🚀 PHASE 4: Function Deployment Status${NC}"
echo "------------------------------------"

# List deployed functions
echo "Currently deployed functions:"
supabase functions list --project-ref "${PROJECT_REF}" || {
    echo -e "${YELLOW}⚠️  Could not list functions${NC}"
}

echo ""
echo -e "${BLUE}🧪 PHASE 5: Runtime Secret Testing${NC}"
echo "--------------------------------"

# Deploy debug function first
echo "Deploying debug-secrets function..."
if supabase functions deploy debug-secrets --project-ref "${PROJECT_REF}"; then
    echo -e "${GREEN}✅ Debug function deployed successfully${NC}"
    
    # Wait for deployment to propagate
    echo "Waiting 10 seconds for deployment to propagate..."
    sleep 10
    
    # Test the debug function
    echo ""
    echo "Testing secret access in runtime environment..."
    
    # Get anon key for testing
    ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}' || echo "")
    
    if [ -z "$ANON_KEY" ]; then
        echo -e "${YELLOW}⚠️  Could not get anon key from local status. Using environment variable if available.${NC}"
        ANON_KEY="${SUPABASE_ANON_KEY:-}"
    fi
    
    if [ -n "$ANON_KEY" ]; then
        echo "Making test request to debug function..."
        
        # Test debug function
        DEBUG_RESPONSE=$(curl -s -X POST "${PROJECT_URL}/functions/v1/debug-secrets" \
            -H "Authorization: Bearer ${ANON_KEY}" \
            -H "Content-Type: application/json" \
            2>/dev/null || echo '{"error": "Failed to call debug function"}')
        
        echo ""
        echo "🔍 DEBUG FUNCTION RESPONSE:"
        echo "=========================="
        echo "${DEBUG_RESPONSE}" | jq '.' 2>/dev/null || echo "${DEBUG_RESPONSE}"
        
        # Parse results
        if echo "${DEBUG_RESPONSE}" | jq -e '.secret_retrieval_tests.claude.found_with_retry == true' > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Claude API key accessible in runtime${NC}"
        else
            echo -e "${RED}❌ Claude API key NOT accessible in runtime${NC}"
        fi
        
        if echo "${DEBUG_RESPONSE}" | jq -e '.secret_retrieval_tests.openai.found_with_retry == true' > /dev/null 2>&1; then
            echo -e "${GREEN}✅ OpenAI API key accessible in runtime${NC}"
        else
            echo -e "${RED}❌ OpenAI API key NOT accessible in runtime${NC}"
        fi
        
    else
        echo -e "${YELLOW}⚠️  No anon key available for testing. Skipping runtime test.${NC}"
    fi
    
else
    echo -e "${RED}❌ Failed to deploy debug function${NC}"
fi

echo ""
echo -e "${BLUE}📊 PHASE 6: Diagnostic Summary${NC}"
echo "----------------------------"

echo ""
echo "🔧 RECOMMENDATIONS:"
echo ""

if [ "$OPENAI_KEY_NAME" = "missing" ]; then
    echo -e "1. ${RED}Set OpenAI API key:${NC}"
    echo "   supabase secrets set OPENAI_API_KEY=sk-proj-your-key-here --project-ref ${PROJECT_REF}"
    echo ""
fi

if [ "$CLAUDE_KEY_NAME" = "missing" ]; then
    echo -e "2. ${RED}Set Claude API key:${NC}"
    echo "   supabase secrets set CLAUDE_API_KEY=sk-ant-your-key-here --project-ref ${PROJECT_REF}"
    echo ""
fi

if [ "$OPENAI_KEY_NAME" = "openai-api-key" ]; then
    echo -e "3. ${YELLOW}OpenAI key naming issue detected:${NC}"
    echo "   Current: 'openai-api-key' (kebab-case)"
    echo "   Expected: 'OPENAI_API_KEY' (UPPER_CASE)"
    echo "   Fix: supabase secrets set OPENAI_API_KEY=\$(supabase secrets list --project-ref ${PROJECT_REF} | grep openai-api-key | awk '{print \$2}') --project-ref ${PROJECT_REF}"
    echo ""
fi

if [ "$CLAUDE_KEY_NAME" = "claude-api-key" ]; then
    echo -e "4. ${YELLOW}Claude key naming issue detected:${NC}"
    echo "   Current: 'claude-api-key' (kebab-case)"
    echo "   Expected: 'CLAUDE_API_KEY' (UPPER_CASE)"
    echo "   Fix: supabase secrets set CLAUDE_API_KEY=\$(supabase secrets list --project-ref ${PROJECT_REF} | grep claude-api-key | awk '{print \$2}') --project-ref ${PROJECT_REF}"
    echo ""
fi

echo -e "5. ${GREEN}After fixing secrets, redeploy functions:${NC}"
echo "   supabase functions deploy translate-content translate-content-claude --project-ref ${PROJECT_REF}"
echo ""

echo -e "6. ${GREEN}Test the translation functions:${NC}"
echo "   curl -X POST \"${PROJECT_URL}/functions/v1/debug-secrets\" -H \"Authorization: Bearer YOUR_ANON_KEY\""
echo ""

echo "📋 NEXT STEPS:"
echo "1. Fix any secret naming issues identified above"
echo "2. Redeploy translation functions"
echo "3. Test with the debug function"
echo "4. Monitor function logs: supabase functions logs --follow --project-ref ${PROJECT_REF}"
echo ""

echo -e "${GREEN}🎉 Diagnostic complete! Review the recommendations above.${NC}"