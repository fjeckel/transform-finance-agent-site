import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

interface SecretTestResult {
  name: string
  found: boolean
  found_with_retry: boolean
  partial_value?: string
  attempts_needed: number
  alternative_names_checked: string[]
  alternative_found?: string
}

interface DebugReport {
  timestamp: string
  environment_info: {
    deno_version: string
    total_env_vars: number
    env_var_sample: string[]
  }
  secret_retrieval_tests: {
    openai: SecretTestResult
    claude: SecretTestResult
  }
  recommendations: string[]
}

// Retry logic for secret retrieval
const getSecretWithRetry = async (
  name: string, 
  alternatives: string[] = [], 
  maxAttempts = 3
): Promise<{ value: string | null; attempts: number; foundName?: string }> => {
  const allNames = [name, ...alternatives]
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    for (const secretName of allNames) {
      const value = Deno.env.get(secretName)
      if (value) {
        return { value, attempts: attempt, foundName: secretName }
      }
    }
    
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100 * attempt))
    }
  }
  
  return { value: null, attempts: maxAttempts }
}

const testSecret = async (
  name: string, 
  alternatives: string[] = []
): Promise<SecretTestResult> => {
  // Test direct access first
  const directValue = Deno.env.get(name)
  
  // Test with retry logic
  const retryResult = await getSecretWithRetry(name, alternatives)
  
  return {
    name,
    found: !!directValue,
    found_with_retry: !!retryResult.value,
    partial_value: retryResult.value ? 
      `${retryResult.value.substring(0, 10)}...${retryResult.value.slice(-4)}` : 
      undefined,
    attempts_needed: retryResult.attempts,
    alternative_names_checked: alternatives,
    alternative_found: retryResult.foundName !== name ? retryResult.foundName : undefined
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Allow both GET and POST for debugging
    if (req.method !== 'GET' && req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders })
    }
    // Get all environment variables for diagnostic purposes
    const allEnvVars = Deno.env.toObject()
    const envKeys = Object.keys(allEnvVars)
    
    // Sample some environment variables (non-sensitive ones)
    const sampleEnvVars = envKeys
      .filter(key => !key.includes('KEY') && !key.includes('SECRET') && !key.includes('TOKEN'))
      .slice(0, 10)

    // Test OpenAI API key with alternatives
    const openaiTest = await testSecret('OPENAI_API_KEY', [
      'OPENAI_KEY', 
      'OPEN_AI_KEY', 
      'OPENAI_SECRET_KEY'
    ])

    // Test Claude API key with alternatives  
    const claudeTest = await testSecret('CLAUDE_API_KEY', [
      'ANTHROPIC_API_KEY',
      'CLAUDE_KEY',
      'ANTHROPIC_KEY',
      'CLAUDE_SECRET_KEY'
    ])

    // Generate recommendations
    const recommendations: string[] = []
    
    if (!openaiTest.found_with_retry) {
      recommendations.push('❌ Set OpenAI API key: supabase secrets set OPENAI_API_KEY=sk-proj-your-key')
    }
    
    if (!claudeTest.found_with_retry) {
      recommendations.push('❌ Set Claude API key: supabase secrets set CLAUDE_API_KEY=sk-ant-your-key')
    }
    
    if (openaiTest.alternative_found) {
      recommendations.push(`⚠️ OpenAI key found under alternative name: ${openaiTest.alternative_found}`)
    }
    
    if (claudeTest.alternative_found) {
      recommendations.push(`⚠️ Claude key found under alternative name: ${claudeTest.alternative_found}`)
    }
    
    if (openaiTest.found_with_retry && claudeTest.found_with_retry) {
      recommendations.push('✅ All API keys are accessible!')
      recommendations.push('🔄 Redeploy translation functions: supabase functions deploy translate-content translate-content-claude')
    }

    // Check for any keys that might be API keys
    const potentialApiKeys = envKeys.filter(key => 
      key.includes('API') || key.includes('KEY') || key.includes('SECRET')
    ).map(key => ({
      name: key,
      hasValue: !!allEnvVars[key],
      length: allEnvVars[key]?.length || 0
    }))

    if (potentialApiKeys.length > 0) {
      recommendations.push(`🔍 Found ${potentialApiKeys.length} potential API key environment variables`)
    }

    const report: DebugReport = {
      timestamp: new Date().toISOString(),
      environment_info: {
        deno_version: Deno.version.deno,
        total_env_vars: envKeys.length,
        env_var_sample: sampleEnvVars
      },
      secret_retrieval_tests: {
        openai: openaiTest,
        claude: claudeTest
      },
      recommendations
    }

    console.log('🔍 Secret Debug Report:', JSON.stringify({
      ...report,
      potential_api_keys: potentialApiKeys
    }, null, 2))

    return new Response(
      JSON.stringify(report, null, 2),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Debug secrets function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Debug function failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
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
})