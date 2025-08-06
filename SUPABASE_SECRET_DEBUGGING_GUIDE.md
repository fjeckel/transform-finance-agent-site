# Supabase Edge Function Secret Access - Debugging & Solutions Guide

## Overview

This guide provides comprehensive solutions for resolving "API key not configured" errors in Supabase edge functions, based on analysis of the translate-content and translate-content-claude functions.

## ✅ Implemented Fixes

### 1. Enhanced Secret Access Pattern with Retry Logic

**Problem**: Secrets sometimes not available during function cold starts or initialization.

**Solution**: Implemented retry logic with exponential backoff in `/supabase/functions/_shared/secrets.ts`:

```typescript
export const getSecretWithRetry = async (
  secretName: string, 
  maxRetries: number = 3, 
  delayMs: number = 100,
  useCache: boolean = true
): Promise<string | null> => {
  // Retry logic with caching and debugging
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const secret = Deno.env.get(secretName)
    if (secret) {
      // Cache successful retrieval
      if (useCache) {
        globalThis.secretCache?.set(secretName, secret)
      }
      return secret
    }
    
    console.warn(`Secret ${secretName} not found on attempt ${attempt}/${maxRetries}`)
    
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  return null
}
```

### 2. Comprehensive Diagnostic Information

**Problem**: Limited debugging information when secrets fail to load.

**Solution**: Enhanced diagnostic reporting including:
- Alternative naming pattern detection
- Environment variable enumeration
- Cold start detection
- Runtime information
- Secret cache status

### 3. Standardized Error Responses

**Problem**: Inconsistent error handling across functions.

**Solution**: Unified error response system with detailed debugging info:

```typescript
export const createSecretMissingResponse = async (
  secretName: string,
  service: string,
  alternativeNames: string[] = [],
  corsHeaders: Record<string, string> = {}
): Promise<Response> => {
  const diagnostics = await getSecretDiagnostics(secretName, alternativeNames)
  // Returns standardized error with comprehensive debug info
}
```

### 4. Global State Management

**Problem**: No tracking of secret initialization state across function invocations.

**Solution**: Global state tracking for cold start detection:

```typescript
declare global {
  var secretsInitialized: boolean | undefined
  var secretCache: Map<string, string> | undefined
}
```

## 🔧 Deployment Best Practices

### 1. Secret Setting Commands

Use these exact commands to set your secrets:

```bash
# OpenAI API Key
supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key-here

# Claude API Key  
supabase secrets set CLAUDE_API_KEY=sk-ant-your-claude-api-key-here

# Verify secrets are set
supabase secrets list
```

### 2. Alternative Naming Patterns

If your secrets use different naming, the system now checks these alternatives:

**OpenAI Alternatives:**
- `OPENAI_KEY`
- `OPENAI_SECRET_KEY`
- `OPENAI_SECRET`
- `OPEN_AI_API_KEY`
- `OPENAI_API_SECRET`

**Claude/Anthropic Alternatives:**
- `ANTHROPIC_API_KEY`
- `CLAUDE_KEY`
- `ANTHROPIC_KEY`
- `CLAUDE_SECRET_KEY`
- `ANTHROPIC_SECRET_KEY`
- `CLAUDE_AI_API_KEY`

### 3. Deployment Sequence

Follow this sequence to avoid timing issues:

```bash
# 1. Set all secrets first
supabase secrets set OPENAI_API_KEY=your-key
supabase secrets set CLAUDE_API_KEY=your-key

# 2. Wait for propagation (30-60 seconds)
sleep 60

# 3. Deploy functions
supabase functions deploy translate-content
supabase functions deploy translate-content-claude
supabase functions deploy debug-secrets

# 4. Test immediately
curl -X POST "https://your-project.supabase.co/functions/v1/debug-secrets"
```

## 🐛 Debugging Tools

### 1. Debug Secrets Function

Enhanced debug function at `/supabase/functions/debug-secrets/index.ts` provides:

- Real-time secret availability testing
- Retry logic validation
- Environment variable enumeration
- Alternative naming detection
- Cold start detection
- Cache status reporting

**Usage:**
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/debug-secrets" \
  -H "Authorization: Bearer YOUR-ANON-KEY"
```

### 2. Function Logs Analysis

Look for these log patterns:

**Success Pattern:**
```
Secret OPENAI_API_KEY found on attempt 1
OpenAI API key found: sk-1234567...
Secrets marked as initialized
```

**Failure Pattern:**
```
Secret OPENAI_API_KEY not found on attempt 1/3
Secret OPENAI_API_KEY not found on attempt 2/3
Secret OPENAI_API_KEY not found on attempt 3/3
=== OPENAI API KEY DIAGNOSTIC ===
```

### 3. Environment Variable Inspection

The debug function now categorizes environment variables:

```json
{
  "env_key_categories": {
    "supabase": ["SUPABASE_URL", "SUPABASE_ANON_KEY", ...],
    "api_keys": ["OPENAI_API_KEY", "CLAUDE_API_KEY", ...],
    "secrets": ["STRIPE_SECRET_KEY", ...],
    "webhooks": ["STRIPE_WEBHOOK_SECRET", ...],
    "other": [...]
  }
}
```

## 🚨 Common Anti-Patterns & Solutions

### Anti-Pattern 1: Direct Environment Access Without Retry
```typescript
// ❌ Bad
const apiKey = Deno.env.get('OPENAI_API_KEY')
if (!apiKey) throw new Error('Missing API key')
```

```typescript
// ✅ Good
const apiKey = await getSecretWithRetry('OPENAI_API_KEY')
if (!apiKey) {
  return await createSecretMissingResponse('OPENAI_API_KEY', 'OpenAI', ALTERNATIVE_SECRET_NAMES.OPENAI, corsHeaders)
}
```

### Anti-Pattern 2: Inconsistent Error Handling
```typescript
// ❌ Bad
if (!apiKey) {
  return new Response('API key missing', { status: 500 })
}
```

```typescript
// ✅ Good
if (!apiKey) {
  return await createSecretMissingResponse('OPENAI_API_KEY', 'OpenAI', ALTERNATIVE_SECRET_NAMES.OPENAI, corsHeaders)
}
```

### Anti-Pattern 3: No Cold Start Detection
```typescript
// ❌ Bad - No tracking of function initialization state
```

```typescript
// ✅ Good
markSecretsInitialized() // After successful secret retrieval
```

## 🔍 Troubleshooting Checklist

### Step 1: Verify Secret Setting
```bash
supabase secrets list
# Should show your API keys in the list
```

### Step 2: Test Secret Retrieval
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/debug-secrets"
# Check the response for secret_retrieval_tests
```

### Step 3: Check Function Logs
```bash
supabase functions logs translate-content
# Look for secret retrieval patterns
```

### Step 4: Verify Function Deployment
```bash
supabase functions list
# Ensure functions are deployed with recent timestamps
```

### Step 5: Test with Different Retry Parameters
If secrets still fail, you can adjust retry parameters:

```typescript
// More aggressive retry for problematic environments
const apiKey = await getSecretWithRetry('OPENAI_API_KEY', 5, 200)
```

## 📊 Performance Considerations

### 1. Secret Caching
- Secrets are cached in memory after first successful retrieval
- Cache persists across function invocations in the same container
- Use `clearSecretCache()` for testing or security requirements

### 2. Retry Logic Impact
- Default: 3 attempts, 100ms delay = ~300ms maximum overhead
- Only applies when secrets are missing (rare in production)
- Successful retrievals are immediate (0ms overhead)

### 3. Diagnostic Overhead
- Debug information is only generated when errors occur
- Production functions should disable verbose logging
- Consider removing debug-secrets function in production

## 🔐 Security Notes

### 1. Debug Function Security
- The debug-secrets function exposes partial secret values
- Remove or restrict access in production environments
- Consider IP whitelisting for debug endpoints

### 2. Log Security
- Secret values are truncated in logs (first 10-15 characters only)
- Full secrets are never logged
- Debug information is sanitized

### 3. Cache Security
- Secret cache is in-memory only (not persisted)
- Cache is cleared when function container restarts
- Use `clearSecretCache()` for additional security

## 🚀 Next Steps

1. **Deploy the enhanced functions** with the new secret management system
2. **Test using the debug-secrets function** to verify secret availability
3. **Monitor function logs** for successful secret retrieval patterns
4. **Remove debug-secrets function** in production for security
5. **Set up monitoring** for secret-related errors in production

## 📝 File Changes Summary

| File | Changes |
|------|---------|
| `supabase/functions/_shared/secrets.ts` | ✅ New shared secret utilities |
| `supabase/functions/translate-content/index.ts` | ✅ Updated to use shared utilities |
| `supabase/functions/translate-content-claude/index.ts` | ✅ Updated to use shared utilities |
| `supabase/functions/debug-secrets/index.ts` | ✅ Enhanced diagnostic capabilities |

This comprehensive solution addresses all the identified secret access anti-patterns and provides robust error handling, debugging capabilities, and production-ready secret management for your Supabase edge functions.