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

// Grok API configuration
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'
const GROK_MODEL = 'grok-4-0709' // Latest Grok 4 model

interface GrokResearchRequest {
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
  temperature?: number
}

interface GrokResearchResponse {
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
    // Get Grok API key using shared secret utilities
    const grokApiKey = await getSecretWithRetry('GROK_API_KEY')
    
    // Handle missing API key with standardized error response
    if (!grokApiKey) {
      return await createSecretMissingResponse(
        'GROK_API_KEY', 
        'Grok (xAI)', 
        ['GROK_API_KEY', 'XAI_API_KEY'],
        corsHeaders
      )
    }

    // Parse request body
    const requestBody: GrokResearchRequest = await req.json()
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

    // Prepare Grok API request (using OpenAI-compatible format)
    const requestPayload = {
      model: GROK_MODEL,
      max_tokens: Math.min(maxTokens, 128000), // Grok has 128k context window
      temperature: Math.max(0.1, Math.min(temperature, 1.0)), // Clamp temperature
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ]
    }

    console.log(`Starting Grok research with ${requestPayload.max_tokens} max tokens`)

    // Call Grok API
    const grokResponse = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${grokApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    })

    if (!grokResponse.ok) {
      const errorText = await grokResponse.text()
      console.error('Grok API Error:', errorText)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Grok API error: ${grokResponse.status} ${grokResponse.statusText}` 
        }), 
        { status: grokResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const grokData = await grokResponse.json()
    const processingTime = Date.now() - startTime

    // Extract content from Grok response
    const content = grokData.choices?.[0]?.message?.content || ''
    
    if (!content) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Empty response from Grok API' 
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate summary (first 200 words or first paragraph)
    const summary = content.split('\n\n')[0]?.slice(0, 500) + 
      (content.length > 500 ? '...' : '') || 
      content.slice(0, 500) + (content.length > 500 ? '...' : '')

    // Calculate costs (Grok pricing: $0.03 per request in beta, but we'll estimate based on tokens)
    const promptTokens = grokData.usage?.prompt_tokens || 0
    const completionTokens = grokData.usage?.completion_tokens || 0
    const totalTokens = promptTokens + completionTokens
    
    // Estimated Grok pricing (based on industry standards, actual may vary)
    // Using $5 per 1M input tokens, $15 per 1M output tokens as estimate
    const totalCostUsd = (promptTokens * 5.0 + completionTokens * 15.0) / 1000000

    console.log(`Grok research completed: ${totalTokens} tokens, $${totalCostUsd.toFixed(4)}, ${processingTime}ms`)

    // Mark secrets as successfully initialized
    markSecretsInitialized()

    // Return success response
    const response: GrokResearchResponse = {
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
    console.error('Grok research function error:', error)
    
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