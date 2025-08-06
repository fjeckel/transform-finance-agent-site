import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { 
  getSecretWithRetry, 
  createSecretMissingResponse, 
  markSecretsInitialized,
  ALTERNATIVE_SECRET_NAMES 
} from '../_shared/secrets.ts'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

// Claude API configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022' // High-quality model for research

interface ClaudeResearchRequest {
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
  temperature?: number
}

interface ClaudeResearchResponse {
  success: boolean
  content?: string
  summary?: string
  tokensUsed?: number
  cost?: number
  processingTime?: number
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // Get Claude API key using shared secret utilities
    const claudeApiKey = await getSecretWithRetry('CLAUDE_API_KEY')
    
    // Handle missing API key with standardized error response
    if (!claudeApiKey) {
      return await createSecretMissingResponse(
        'CLAUDE_API_KEY', 
        'Claude', 
        ALTERNATIVE_SECRET_NAMES.CLAUDE,
        corsHeaders
      )
    }

    // Parse request body
    const requestBody: ClaudeResearchRequest = await req.json()
    const { 
      systemPrompt, 
      userPrompt, 
      maxTokens = 4000, 
      temperature = 0.3 
    } = requestBody

    // Validate request
    if (!systemPrompt || !userPrompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: systemPrompt, userPrompt' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare Claude API request
    const requestPayload = {
      model: CLAUDE_MODEL,
      max_tokens: Math.min(maxTokens, 8192), // Claude 3.5 Sonnet limit
      temperature: Math.max(0.1, Math.min(temperature, 1.0)), // Clamp temperature
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    }

    console.log(`Starting Claude research with ${requestPayload.max_tokens} max tokens`)

    // Call Claude API
    const claudeResponse = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${claudeApiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': claudeApiKey
      },
      body: JSON.stringify(requestPayload),
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API Error:', errorText)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Claude API error: ${claudeResponse.status} ${claudeResponse.statusText}` 
        }), 
        { status: claudeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const claudeData = await claudeResponse.json()
    const processingTime = Date.now() - startTime

    // Extract content from Claude response
    const content = claudeData.content?.[0]?.text || ''
    
    if (!content) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Empty response from Claude API' 
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate summary (first 200 words or first paragraph)
    const summary = content.split('\n\n')[0]?.slice(0, 500) + 
      (content.length > 500 ? '...' : '') || 
      content.slice(0, 500) + (content.length > 500 ? '...' : '')

    // Calculate costs (Claude 3.5 Sonnet pricing)
    const inputTokens = claudeData.usage?.input_tokens || 0
    const outputTokens = claudeData.usage?.output_tokens || 0
    const totalTokens = inputTokens + outputTokens
    
    // Claude 3.5 Sonnet pricing: $3 per 1M input tokens, $15 per 1M output tokens
    const totalCostUsd = (inputTokens * 3.0 + outputTokens * 15.0) / 1000000

    console.log(`Claude research completed: ${totalTokens} tokens, $${totalCostUsd.toFixed(4)}, ${processingTime}ms`)

    // Mark secrets as successfully initialized
    markSecretsInitialized()

    // Return success response
    const response: ClaudeResearchResponse = {
      success: true,
      content,
      summary,
      tokensUsed: totalTokens,
      cost: totalCostUsd,
      processingTime
    }

    return new Response(
      JSON.stringify(response), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('Claude research function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        processingTime
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})