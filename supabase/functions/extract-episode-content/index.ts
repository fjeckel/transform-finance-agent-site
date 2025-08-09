import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
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

// Types for content extraction requests
interface ExtractionRequest {
  source_type: 'file' | 'url' | 'text' | 'audio'
  source_name?: string
  source_content: string
  template_id?: string
  episode_id?: string
  ai_provider?: 'claude' | 'openai' | 'grok'
  processing_options?: {
    parallel_processing?: boolean
    quality_validation?: boolean
    auto_approve?: boolean
  }
}

interface ExtractionResponse {
  success: boolean
  extraction_id?: string
  extracted_fields?: Record<string, any>
  confidence_scores?: Record<string, number>
  quality_score?: number
  processing_time?: number
  cost_usd?: number
  validation_errors?: string[]
  error?: string
}

// AI provider configurations
const AI_PROVIDERS = {
  claude: {
    api_url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8192,
    temperature: 0.3,
    input_cost_per_1k: 0.003,
    output_cost_per_1k: 0.015
  },
  openai: {
    api_url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4-turbo',
    max_tokens: 4096,
    temperature: 0.3,
    input_cost_per_1k: 0.010,
    output_cost_per_1k: 0.030
  },
  grok: {
    api_url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-4-0709',
    max_tokens: 8192,
    temperature: 0.3,
    input_cost_per_1k: 0.005,
    output_cost_per_1k: 0.015
  }
}

// Default extraction template for podcast episodes
const DEFAULT_PODCAST_TEMPLATE = {
  title: {
    prompt: "Extract the episode title from the content. Look for clear episode titles, headers, or main topics. The title should be engaging and descriptive.",
    required: true,
    max_length: 200
  },
  summary: {
    prompt: "Create a concise 2-3 sentence summary that captures the essence of the episode and its key takeaways for podcast listeners.",
    required: true,
    max_length: 500
  },
  description: {
    prompt: "Generate a detailed description suitable for podcast directories. Include key topics, guest information if mentioned, and what listeners will learn.",
    required: true,
    max_length: 1000
  },
  content: {
    prompt: "Structure the main content into clear sections with key points, topics discussed, important insights, and actionable takeaways. Maintain the conversational tone appropriate for podcast content.",
    required: false,
    max_length: 10000
  },
  key_topics: {
    prompt: "Extract 3-7 key topics, themes, or subjects discussed in the episode. Focus on the main business, finance, or technology topics covered.",
    required: false,
    type: "array"
  },
  guest_names: {
    prompt: "Identify any guest names, speakers, or interviewees mentioned in the content. Return as a list of names.",
    required: false,
    type: "array"
  }
}

// Content validation rules
const VALIDATION_RULES = {
  title: {
    min_length: 10,
    max_length: 200,
    required: true
  },
  summary: {
    min_length: 50,
    max_length: 500,
    required: true
  },
  description: {
    min_length: 100,
    max_length: 1000,
    required: true
  },
  content: {
    min_length: 200,
    max_length: 10000,
    required: false
  }
}

// Extract content using AI provider
async function extractContentWithAI(
  provider: string, 
  content: string, 
  template: any
): Promise<any> {
  const config = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS]
  if (!config) {
    throw new Error(`Unsupported AI provider: ${provider}`)
  }

  const apiKey = await getSecretWithRetry(
    provider === 'claude' ? 'CLAUDE_API_KEY' :
    provider === 'openai' ? 'OPENAI_API_KEY' :
    'GROK_API_KEY'
  )

  if (!apiKey) {
    throw new Error(`API key not found for provider: ${provider}`)
  }

  // Build extraction prompt
  const systemPrompt = `You are an expert content analyst specializing in extracting structured information from podcast and media content. Your task is to analyze the provided content and extract the requested fields with high accuracy and appropriate tone for the target audience.

Guidelines:
- Maintain professional but engaging tone appropriate for business/finance podcast audiences
- Extract only information that is clearly present in the content
- For arrays, return valid JSON arrays
- Ensure extracted content is original and well-structured
- Focus on key business insights and actionable information

Respond with ONLY a valid JSON object containing the extracted fields. Do not include any explanation or additional text.`

  const extractionFields = Object.entries(template).map(([field, config]: [string, any]) => {
    return `"${field}": ${JSON.stringify({
      instruction: config.prompt,
      type: config.type || "string",
      required: config.required || false,
      max_length: config.max_length
    })}`
  }).join(',\n')

  const userPrompt = `Extract the following fields from this content:

Fields to extract:
{
${extractionFields}
}

Content to analyze:
${content.substring(0, 50000)} ${content.length > 50000 ? '[TRUNCATED]' : ''}

Respond with a JSON object containing the extracted fields:`

  let response: Response
  let requestBody: any

  if (provider === 'claude') {
    requestBody = {
      model: config.model,
      max_tokens: config.max_tokens,
      temperature: config.temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    }

    response = await fetch(config.api_url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    })
  } else {
    // OpenAI and Grok use the same API format
    requestBody = {
      model: config.model,
      max_tokens: config.max_tokens,
      temperature: config.temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    }

    response = await fetch(config.api_url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
  }

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`${provider} API error: ${response.status} - ${errorData}`)
  }

  const data = await response.json()
  
  // Parse response based on provider
  let extractedText: string
  let inputTokens = 0
  let outputTokens = 0

  if (provider === 'claude') {
    extractedText = data.content[0].text
    inputTokens = data.usage?.input_tokens || 0
    outputTokens = data.usage?.output_tokens || 0
  } else {
    extractedText = data.choices[0].message.content
    inputTokens = data.usage?.prompt_tokens || 0
    outputTokens = data.usage?.completion_tokens || 0
  }

  // Parse JSON response
  let extractedFields: any
  try {
    // Try to extract JSON from response
    const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      extractedFields = JSON.parse(jsonMatch[0])
    } else {
      extractedFields = JSON.parse(extractedText)
    }
  } catch (error) {
    throw new Error(`Failed to parse AI response as JSON: ${extractedText.substring(0, 200)}...`)
  }

  // Calculate cost
  const inputCost = (inputTokens / 1000) * config.input_cost_per_1k
  const outputCost = (outputTokens / 1000) * config.output_cost_per_1k
  const totalCost = inputCost + outputCost

  return {
    extracted_fields: extractedFields,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: totalCost,
    provider,
    model: config.model
  }
}

// Validate extracted content
function validateExtractedContent(extractedFields: any, template: any): string[] {
  const errors: string[] = []

  for (const [field, config] of Object.entries(template) as [string, any][]) {
    const value = extractedFields[field]
    const rules = VALIDATION_RULES[field as keyof typeof VALIDATION_RULES]

    // Check required fields
    if (config.required && (!value || (typeof value === 'string' && value.trim().length === 0))) {
      errors.push(`Required field '${field}' is missing or empty`)
      continue
    }

    // Validate string fields
    if (value && typeof value === 'string' && rules) {
      if (rules.min_length && value.length < rules.min_length) {
        errors.push(`Field '${field}' is too short (minimum ${rules.min_length} characters)`)
      }
      if (rules.max_length && value.length > rules.max_length) {
        errors.push(`Field '${field}' is too long (maximum ${rules.max_length} characters)`)
      }
    }

    // Validate array fields
    if (config.type === 'array' && value && !Array.isArray(value)) {
      errors.push(`Field '${field}' should be an array`)
    }
  }

  return errors
}

// Calculate quality score based on various factors
function calculateQualityScore(extractedFields: any, template: any, validationErrors: string[]): number {
  let score = 1.0

  // Penalty for validation errors
  score -= validationErrors.length * 0.1

  // Check completeness
  const requiredFields = Object.entries(template).filter(([_, config]: [string, any]) => config.required)
  const completedRequired = requiredFields.filter(([field, _]) => 
    extractedFields[field] && extractedFields[field].toString().trim().length > 0
  )
  const completenessRatio = completedRequired.length / requiredFields.length
  score *= completenessRatio

  // Check content quality (basic heuristics)
  if (extractedFields.title && extractedFields.title.length > 20) score += 0.05
  if (extractedFields.summary && extractedFields.summary.length > 100) score += 0.05
  if (extractedFields.description && extractedFields.description.length > 200) score += 0.05

  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score))
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const requestBody: ExtractionRequest = await req.json()
    const { 
      source_type, 
      source_name, 
      source_content, 
      template_id, 
      episode_id, 
      ai_provider = 'claude',
      processing_options = {}
    } = requestBody

    // Validate request
    if (!source_content || source_content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'source_content is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get extraction template
    let template = DEFAULT_PODCAST_TEMPLATE
    if (template_id) {
      const { data: templateData, error: templateError } = await supabaseAdmin
        .from('extraction_templates')
        .select('extraction_fields')
        .eq('id', template_id)
        .single()

      if (templateError) {
        console.error('Template fetch error:', templateError)
      } else if (templateData) {
        template = templateData.extraction_fields
      }
    }

    const startTime = Date.now()

    // Create extraction record
    const { data: extractionData, error: insertError } = await supabaseAdmin
      .from('content_extractions')
      .insert({
        episode_id: episode_id || null,
        source_type,
        source_name: source_name || null,
        source_content: source_content.substring(0, 50000), // Limit stored content
        source_metadata: {
          content_length: source_content.length,
          truncated: source_content.length > 50000
        },
        ai_provider,
        status: 'processing',
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Extraction insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create extraction record' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    try {
      // Extract content using AI
      const aiResult = await extractContentWithAI(ai_provider, source_content, template)
      
      // Validate extracted content
      const validationErrors = validateExtractedContent(aiResult.extracted_fields, template)
      
      // Calculate quality score
      const qualityScore = calculateQualityScore(aiResult.extracted_fields, template, validationErrors)
      
      const processingTime = Date.now() - startTime

      // Save AI result
      await supabaseAdmin
        .from('extraction_ai_results')
        .insert({
          extraction_id: extractionData.id,
          provider: aiResult.provider,
          model: aiResult.model,
          extracted_data: aiResult.extracted_fields,
          input_tokens: aiResult.input_tokens,
          output_tokens: aiResult.output_tokens,
          cost_usd: aiResult.cost_usd,
          processing_time_ms: processingTime,
          confidence_score: qualityScore,
          status: 'completed',
          completed_at: new Date().toISOString()
        })

      // Update extraction record
      await supabaseAdmin
        .from('content_extractions')
        .update({
          extracted_fields: aiResult.extracted_fields,
          confidence_scores: Object.fromEntries(
            Object.keys(aiResult.extracted_fields).map(field => [field, qualityScore])
          ),
          processing_cost_usd: aiResult.cost_usd,
          status: validationErrors.length === 0 ? 'completed' : 'failed',
          processing_time_ms: processingTime,
          tokens_used: {
            input: aiResult.input_tokens,
            output: aiResult.output_tokens,
            total: aiResult.input_tokens + aiResult.output_tokens
          },
          quality_score: qualityScore,
          validation_errors: validationErrors,
          review_status: processing_options.auto_approve && validationErrors.length === 0 ? 'approved' : 'pending'
        })
        .eq('id', extractionData.id)

      // Mark secrets as initialized
      markSecretsInitialized()

      // Return response
      const response: ExtractionResponse = {
        success: true,
        extraction_id: extractionData.id,
        extracted_fields: aiResult.extracted_fields,
        confidence_scores: Object.fromEntries(
          Object.keys(aiResult.extracted_fields).map(field => [field, qualityScore])
        ),
        quality_score: qualityScore,
        processing_time: processingTime,
        cost_usd: aiResult.cost_usd,
        validation_errors: validationErrors
      }

      return new Response(
        JSON.stringify(response), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (aiError) {
      console.error('AI processing error:', aiError)
      
      // Update extraction record with error
      await supabaseAdmin
        .from('content_extractions')
        .update({
          status: 'failed',
          processing_time_ms: Date.now() - startTime,
          validation_errors: [`AI processing error: ${aiError.message}`]
        })
        .eq('id', extractionData.id)

      return new Response(
        JSON.stringify({ 
          success: false, 
          extraction_id: extractionData.id,
          error: `AI processing failed: ${aiError.message}` 
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Content extraction function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})