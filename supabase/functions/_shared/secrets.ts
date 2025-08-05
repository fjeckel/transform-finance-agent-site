/**
 * Shared secret management utilities for Supabase Edge Functions
 * 
 * This module provides robust secret access patterns with retry logic,
 * comprehensive debugging, and cold start detection for better reliability
 * across all edge functions.
 */

// Global state for secret initialization tracking
declare global {
  var secretsInitialized: boolean | undefined
  var secretCache: Map<string, string> | undefined
}

// Initialize global secret cache if not exists
if (!globalThis.secretCache) {
  globalThis.secretCache = new Map<string, string>()
}

/**
 * Enhanced secret retrieval with retry logic and caching
 * 
 * @param secretName - The environment variable name to retrieve
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param delayMs - Delay between retries in milliseconds (default: 100)
 * @param useCache - Whether to use cache for previously retrieved secrets (default: true)
 * @returns The secret value or null if not found
 */
export const getSecretWithRetry = async (
  secretName: string, 
  maxRetries: number = 3, 
  delayMs: number = 100,
  useCache: boolean = true
): Promise<string | null> => {
  // Check cache first if enabled
  if (useCache && globalThis.secretCache?.has(secretName)) {
    const cached = globalThis.secretCache.get(secretName)
    if (cached) {
      console.debug(`Secret ${secretName} retrieved from cache`)
      return cached
    }
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const secret = Deno.env.get(secretName)
    if (secret) {
      // Cache the secret for future use
      if (useCache) {
        globalThis.secretCache?.set(secretName, secret)
      }
      
      console.debug(`Secret ${secretName} found on attempt ${attempt}`)
      return secret
    }
    
    // Log attempt for debugging
    console.warn(`Secret ${secretName} not found on attempt ${attempt}/${maxRetries}`)
    
    // Wait before retry (except on last attempt)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  console.error(`Secret ${secretName} not found after ${maxRetries} attempts`)
  return null
}

/**
 * Common alternative naming patterns for different services
 */
export const ALTERNATIVE_SECRET_NAMES = {
  OPENAI: [
    'OPENAI_KEY',
    'OPENAI_SECRET_KEY', 
    'OPENAI_SECRET',
    'OPEN_AI_API_KEY',
    'OPENAI_API_SECRET'
  ],
  CLAUDE: [
    'ANTHROPIC_API_KEY',
    'CLAUDE_KEY',
    'ANTHROPIC_KEY',
    'CLAUDE_SECRET_KEY',
    'ANTHROPIC_SECRET_KEY',
    'CLAUDE_AI_API_KEY'
  ],
  STRIPE: [
    'STRIPE_KEY',
    'STRIPE_SECRET',
    'STRIPE_PRIVATE_KEY'
  ]
}

/**
 * Comprehensive secret diagnostic information
 * 
 * @param primarySecretName - The primary secret name being checked
 * @param alternativeNames - Array of alternative names to check
 * @returns Diagnostic information object
 */
export const getSecretDiagnostics = async (
  primarySecretName: string,
  alternativeNames: string[] = []
) => {
  const foundAlternatives: string[] = []
  
  // Check alternative naming patterns
  for (const altName of alternativeNames) {
    const altSecret = await getSecretWithRetry(altName, 1, 50, false)
    if (altSecret) {
      foundAlternatives.push(altName)
    }
  }

  const allEnvKeys = Object.keys(Deno.env.toObject())
  
  return {
    primary_secret_exists: !!Deno.env.get(primarySecretName),
    checked_alternatives: alternativeNames,
    found_alternatives: foundAlternatives,
    total_env_vars: allEnvKeys.length,
    api_related_keys: allEnvKeys.filter(key => 
      key.includes('API') || key.includes('KEY') || key.includes('SECRET')
    ),
    function_cold_start: !globalThis.secretsInitialized,
    cache_size: globalThis.secretCache?.size || 0,
    runtime_info: {
      deno_version: Deno.version.deno,
      v8_version: Deno.version.v8
    }
  }
}

/**
 * Create a standardized error response for missing secrets
 * 
 * @param secretName - Name of the missing secret
 * @param service - Service name (e.g., 'OpenAI', 'Claude')
 * @param alternativeNames - Alternative names that were checked
 * @param corsHeaders - CORS headers to include in response
 * @returns Response object with detailed error information
 */
export const createSecretMissingResponse = async (
  secretName: string,
  service: string,
  alternativeNames: string[] = [],
  corsHeaders: Record<string, string> = {}
): Promise<Response> => {
  const diagnostics = await getSecretDiagnostics(secretName, alternativeNames)
  
  console.error(`=== ${service.toUpperCase()} SECRET DIAGNOSTIC ===`)
  console.error(`${secretName} exists:`, diagnostics.primary_secret_exists)
  console.error('Environment variables count:', diagnostics.total_env_vars)
  console.error('API-related keys:', diagnostics.api_related_keys)
  console.error('Found alternatives:', diagnostics.found_alternatives)
  
  return new Response(
    JSON.stringify({ 
      error: `${service} API key not configured`,
      service: service.toLowerCase(),
      debug: diagnostics
    }), 
    { 
      status: 500, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  )
}

/**
 * Mark secrets as successfully initialized
 * This helps with cold start detection in future requests
 */
export const markSecretsInitialized = (): void => {
  globalThis.secretsInitialized = true
  console.debug('Secrets marked as initialized')
}

/**
 * Clear the secret cache (useful for testing or security)
 */
export const clearSecretCache = (): void => {
  globalThis.secretCache?.clear()
  console.debug('Secret cache cleared')
}

/**
 * Get comprehensive environment diagnostic report
 * Useful for debugging edge function environments
 */
export const getEnvironmentDiagnostics = () => {
  const allEnvKeys = Object.keys(Deno.env.toObject())
  
  return {
    timestamp: new Date().toISOString(),
    environment: 'production', // Edge functions run in production
    total_env_vars: allEnvKeys.length,
    secrets_initialized: !!globalThis.secretsInitialized,
    cache_size: globalThis.secretCache?.size || 0,
    
    // Group environment variables by type
    env_key_categories: {
      supabase: allEnvKeys.filter(key => key.startsWith('SUPABASE_')),
      api_keys: allEnvKeys.filter(key => key.includes('API_KEY')),
      secrets: allEnvKeys.filter(key => key.includes('SECRET')),
      webhooks: allEnvKeys.filter(key => key.includes('WEBHOOK')),
      other: allEnvKeys.filter(key => 
        !key.startsWith('SUPABASE_') && 
        !key.includes('API_KEY') && 
        !key.includes('SECRET') && 
        !key.includes('WEBHOOK')
      )
    },
    
    runtime_info: {
      deno_version: Deno.version.deno,
      v8_version: Deno.version.v8,
      typescript_version: Deno.version.typescript
    }
  }
}