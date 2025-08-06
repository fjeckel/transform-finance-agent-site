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

// OpenAI API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_MODEL = 'gpt-4-turbo' // High-quality model for research

interface OpenAIResearchRequest {
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
  temperature?: number
}

interface OpenAIResearchResponse {
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
    // Get OpenAI API key using shared secret utilities
    const openaiApiKey = await getSecretWithRetry('OPENAI_API_KEY')
    
    // Handle missing API key with standardized error response
    if (!openaiApiKey) {
      return await createSecretMissingResponse(
        'OPENAI_API_KEY', 
        'OpenAI', 
        ALTERNATIVE_SECRET_NAMES.OPENAI,
        corsHeaders
      )
    }

    // Parse request body
    const requestBody: OpenAIResearchRequest = await req.json()
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

    // Prepare OpenAI API request
    const requestPayload = {
      model: OPENAI_MODEL,
      max_tokens: Math.min(maxTokens, 4096), // GPT-4 Turbo limit
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

    console.log(`Starting OpenAI research with ${requestPayload.max_tokens} max tokens`)

    // Call OpenAI API
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API Error:', errorText)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `OpenAI API error: ${openaiResponse.status} ${openaiResponse.statusText}` 
        }), 
        { status: openaiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiData = await openaiResponse.json()
    const processingTime = Date.now() - startTime

    // Extract content from OpenAI response
    const content = openaiData.choices?.[0]?.message?.content || ''
    
    if (!content) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Empty response from OpenAI API' 
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate summary (first 200 words or first paragraph)
    const summary = content.split('\n\n')[0]?.slice(0, 500) + 
      (content.length > 500 ? '...' : '') || 
      content.slice(0, 500) + (content.length > 500 ? '...' : '')

    // Calculate costs (GPT-4 Turbo pricing)
    const promptTokens = openaiData.usage?.prompt_tokens || 0
    const completionTokens = openaiData.usage?.completion_tokens || 0
    const totalTokens = promptTokens + completionTokens
    
    // GPT-4 Turbo pricing: $10 per 1M input tokens, $30 per 1M output tokens
    const totalCostUsd = (promptTokens * 10.0 + completionTokens * 30.0) / 1000000

    console.log(`OpenAI research completed: ${totalTokens} tokens, $${totalCostUsd.toFixed(4)}, ${processingTime}ms`)

    // Mark secrets as successfully initialized
    markSecretsInitialized()

    // Return success response
    const response: OpenAIResearchResponse = {
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
    console.error('OpenAI research function error:', error)
    
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