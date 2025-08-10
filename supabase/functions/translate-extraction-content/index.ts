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

// Types for translation requests
interface TranslationRequest {
  extraction_id: string
  target_languages: string[]
  source_language?: string // 'auto' for auto-detection or ISO language code
  ai_provider?: 'openai' | 'claude' | 'grok'
  processing_options?: {
    parallel_processing?: boolean
    quality_validation?: boolean
    auto_approve?: boolean
  }
}

interface TranslationResponse {
  success: boolean
  translation_ids?: string[]
  translations?: Record<string, any>
  total_cost?: number
  processing_time?: number
  error?: string
}

// AI provider configurations for translation
const TRANSLATION_PROVIDERS = {
  openai: {
    api_url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini', // Cost-effective for translations
    max_tokens: 4096,
    temperature: 0.2, // Lower temperature for more consistent translations
    input_cost_per_1k: 0.00015,
    output_cost_per_1k: 0.0006
  },
  claude: {
    api_url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-haiku-20240307', // Fast and cost-effective
    max_tokens: 4096,
    temperature: 0.2,
    input_cost_per_1k: 0.00025,
    output_cost_per_1k: 0.00125
  },
  grok: {
    api_url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-4-0709',
    max_tokens: 4096,
    temperature: 0.2,
    input_cost_per_1k: 0.0001,
    output_cost_per_1k: 0.0005
  }
}

// Language configuration
const LANGUAGE_NAMES = {
  'en': 'English',
  'de': 'German (Deutsch)',
  'fr': 'French (Français)', 
  'es': 'Spanish (Español)',
  'it': 'Italian (Italiano)',
  'pt': 'Portuguese (Português)',
  'nl': 'Dutch (Nederlands)',
  'sv': 'Swedish (Svenska)',
  'da': 'Danish (Dansk)',
  'no': 'Norwegian (Norsk)'
}

// Translation prompts optimized for content extraction fields
const TRANSLATION_PROMPTS = {
  system: `You are a professional translator specializing in podcast and content translation.

Your task is to translate extracted content fields while maintaining:
- Natural, engaging tone appropriate for the content type
- Technical accuracy and consistency
- Cultural appropriateness for the target audience
- Original formatting (markdown, bullet points, etc.)
- SEO-friendly language when applicable

Always provide translations in valid JSON format only.`,

  user: (fields: Record<string, any>, sourceLang: string, targetLang: string) => `
Translate the following extracted content fields from ${LANGUAGE_NAMES[sourceLang] || sourceLang} to ${LANGUAGE_NAMES[targetLang] || targetLang}:

${JSON.stringify(fields, null, 2)}

Guidelines:
- For "title": Create an engaging, SEO-friendly title that captures the essence
- For "summary": Maintain the key points while making it natural in the target language
- For "description": Keep it compelling and informative for the target audience
- For "content": Preserve structure and formatting while translating naturally
- For arrays (key_topics, guest_names, etc.): Translate individual items appropriately

Return ONLY a JSON object with the same field structure containing the translations.
Example: {"title": "Translated title", "summary": "Translated summary", "content": "Translated content"}
`
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize secrets at startup
    await markSecretsInitialized()

    // Parse request body
    const { 
      extraction_id, 
      target_languages = [], 
      source_language = 'auto',
      ai_provider = 'openai',
      processing_options = {}
    }: TranslationRequest = await req.json()

    // Validation
    if (!extraction_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'extraction_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!target_languages.length) {
      return new Response(
        JSON.stringify({ success: false, error: 'target_languages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get extraction data
    const { data: extraction, error: extractionError } = await supabase
      .from('content_extractions')
      .select('*')
      .eq('id', extraction_id)
      .single()

    if (extractionError || !extraction) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Extraction not found or access denied' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const startTime = Date.now()
    const translationIds: string[] = []
    const translations: Record<string, any> = {}
    let totalCost = 0

    // Auto-detect source language if needed
    let detectedSourceLang = source_language
    if (source_language === 'auto') {
      detectedSourceLang = extraction.source_language || 'en' // Fallback to English
      // If extraction also has 'auto', fallback to English
      if (detectedSourceLang === 'auto') {
        detectedSourceLang = 'en'
      }
    }

    // Process each target language
    for (const targetLang of target_languages) {
      if (targetLang === detectedSourceLang) {
        console.log(`Skipping translation for source language: ${targetLang}`)
        continue
      }

      try {
        const translationStartTime = Date.now()

        // Check if translation already exists
        const { data: existingTranslation } = await supabase
          .from('extraction_translations')
          .select('*')
          .eq('extraction_id', extraction_id)
          .eq('language_code', targetLang)
          .single()

        let translationResult

        if (existingTranslation && existingTranslation.translation_status === 'completed') {
          // Use existing translation
          translationResult = existingTranslation
          console.log(`Using existing translation for ${targetLang}`)
        } else {
          // Create new translation
          const translationData = await translateContent(
            extraction.extracted_fields,
            detectedSourceLang,
            targetLang,
            ai_provider
          )

          // Insert translation record
          const { data: newTranslation, error: insertError } = await supabase
            .from('extraction_translations')
            .upsert({
              extraction_id,
              language_code: targetLang,
              translated_fields: translationData.translated_fields,
              confidence_scores: translationData.confidence_scores,
              translation_method: 'ai',
              ai_provider,
              ai_model: TRANSLATION_PROVIDERS[ai_provider]?.model,
              prompt_tokens: translationData.usage.prompt_tokens,
              completion_tokens: translationData.usage.completion_tokens,
              translation_cost_usd: translationData.cost,
              processing_time_ms: Date.now() - translationStartTime,
              translation_status: 'completed',
              quality_score: translationData.quality_score || 0.85
            })
            .select()
            .single()

          if (insertError) {
            console.error(`Failed to save translation for ${targetLang}:`, insertError)
            continue
          }

          translationResult = newTranslation
          totalCost += translationData.cost
        }

        translationIds.push(translationResult.id)
        translations[targetLang] = translationResult

      } catch (error) {
        console.error(`Translation failed for ${targetLang}:`, error)
        
        // Insert failed translation record
        await supabase
          .from('extraction_translations')
          .upsert({
            extraction_id,
            language_code: targetLang,
            translation_status: 'failed',
            validation_errors: [error.message || 'Unknown translation error']
          })
      }
    }

    // Update extraction with multilingual flags
    await supabase
      .from('content_extractions')
      .update({
        multilingual_enabled: true,
        target_languages,
        source_language: detectedSourceLang,
        translation_cost_usd: totalCost
      })
      .eq('id', extraction_id)

    const processingTime = Date.now() - startTime

    return new Response(
      JSON.stringify({
        success: true,
        translation_ids: translationIds,
        translations,
        total_cost: totalCost,
        processing_time: processingTime,
        source_language: detectedSourceLang
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Translation service error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Function to translate content using AI providers
async function translateContent(
  extractedFields: Record<string, any>,
  sourceLang: string,
  targetLang: string,
  provider: string
): Promise<{
  translated_fields: Record<string, any>
  confidence_scores: Record<string, number>
  usage: { prompt_tokens: number, completion_tokens: number }
  cost: number
  quality_score: number
}> {
  const config = TRANSLATION_PROVIDERS[provider]
  if (!config) {
    throw new Error(`Unsupported translation provider: ${provider}`)
  }

  // Get API key
  const apiKey = await getSecretWithRetry(
    provider === 'openai' ? 'OPENAI_API_KEY' : 
    provider === 'claude' ? 'ANTHROPIC_API_KEY' :
    'XAI_API_KEY',
    ALTERNATIVE_SECRET_NAMES[provider === 'openai' ? 'OPENAI_API_KEY' : 
                            provider === 'claude' ? 'ANTHROPIC_API_KEY' : 'XAI_API_KEY']
  )

  if (!apiKey) {
    return createSecretMissingResponse(
      provider === 'openai' ? 'OPENAI_API_KEY' : 
      provider === 'claude' ? 'ANTHROPIC_API_KEY' :
      'XAI_API_KEY'
    )
  }

  let requestData, headers

  if (provider === 'claude') {
    // Claude API format
    headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }

    requestData = {
      model: config.model,
      max_tokens: config.max_tokens,
      temperature: config.temperature,
      messages: [
        {
          role: 'user',
          content: `${TRANSLATION_PROMPTS.system}\n\n${TRANSLATION_PROMPTS.user(extractedFields, sourceLang, targetLang)}`
        }
      ]
    }
  } else {
    // OpenAI/Grok API format
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }

    requestData = {
      model: config.model,
      max_tokens: config.max_tokens,
      temperature: config.temperature,
      messages: [
        {
          role: 'system',
          content: TRANSLATION_PROMPTS.system
        },
        {
          role: 'user',
          content: TRANSLATION_PROMPTS.user(extractedFields, sourceLang, targetLang)
        }
      ]
    }
  }

  const response = await fetch(config.api_url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestData)
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Translation API error (${response.status}): ${errorData}`)
  }

  const responseData = await response.json()

  // Parse response based on provider
  let translatedContent: string
  let usage = { input_tokens: 0, output_tokens: 0 }

  if (provider === 'claude') {
    translatedContent = responseData.content[0].text
    usage = {
      input_tokens: responseData.usage.input_tokens,
      output_tokens: responseData.usage.output_tokens
    }
  } else {
    translatedContent = responseData.choices[0].message.content
    usage = {
      input_tokens: responseData.usage.prompt_tokens,
      output_tokens: responseData.usage.completion_tokens
    }
  }

  // Parse JSON response
  let translatedFields: Record<string, any>
  try {
    // Clean the response to extract JSON
    const jsonStart = translatedContent.indexOf('{')
    const jsonEnd = translatedContent.lastIndexOf('}') + 1
    const jsonString = translatedContent.slice(jsonStart, jsonEnd)
    
    translatedFields = JSON.parse(jsonString)
  } catch (error) {
    throw new Error(`Failed to parse translation response: ${error.message}`)
  }

  // Calculate cost
  const cost = (usage.input_tokens / 1000 * config.input_cost_per_1k) + 
               (usage.output_tokens / 1000 * config.output_cost_per_1k)

  // Generate confidence scores (simplified heuristic)
  const confidenceScores: Record<string, number> = {}
  for (const field in translatedFields) {
    const originalLength = String(extractedFields[field] || '').length
    const translatedLength = String(translatedFields[field] || '').length
    
    // Simple heuristic: confidence based on length ratio and field completeness
    const lengthRatio = translatedLength / Math.max(originalLength, 1)
    const lengthScore = Math.min(1.0, Math.max(0.5, lengthRatio))
    const completenessScore = translatedFields[field] ? 0.9 : 0.1
    
    confidenceScores[field] = (lengthScore + completenessScore) / 2
  }

  // Overall quality score
  const qualityScore = Object.values(confidenceScores).reduce((a, b) => a + b, 0) / 
                       Math.max(Object.keys(confidenceScores).length, 1)

  return {
    translated_fields: translatedFields,
    confidence_scores: confidenceScores,
    usage: {
      prompt_tokens: usage.input_tokens,
      completion_tokens: usage.output_tokens
    },
    cost,
    quality_score: qualityScore
  }
}