import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Types for translation requests
interface TranslationRequest {
  contentId: string
  contentType: 'insight' | 'episode' | 'category'
  targetLanguage: string
  fields: string[] // Which fields to translate: ['title', 'content', 'description']
  priority?: 'high' | 'medium' | 'low'
}

interface TranslationResponse {
  success: boolean
  translationId?: string
  translations?: Record<string, string>
  error?: string
  cost?: {
    promptTokens: number
    completionTokens: number
    totalCostUsd: number
  }
}

// Claude API configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-3-5-haiku-20241022' // Cost-effective model for translations

// Translation prompts by content type (optimized for Claude)
const TRANSLATION_PROMPTS = {
  insight: {
    system: `You are a professional translator specializing in financial and business content. Your task is to translate content accurately while maintaining:

- Technical terminology consistency
- Professional tone appropriate for business executives and finance professionals  
- Cultural appropriateness for the target market
- Original formatting (markdown, HTML tags, etc.)
- Engaging and accessible language for the target audience

Always respond with ONLY a valid JSON object containing the translated fields.`,
    
    user: (fields: Record<string, string>, targetLang: string) => `
Please translate the following financial insight content to ${targetLang}. Maintain the professional tone and ensure technical terms are accurately translated for business professionals.

Content to translate:
${JSON.stringify(fields, null, 2)}

Respond with ONLY a JSON object with the same field names containing the high-quality translations. Example format:
{"title": "Translated title", "content": "Translated content", "description": "Translated description"}
`
  },
  
  episode: {
    system: `You are a professional translator for podcast and audio content. Your expertise includes:

- Maintaining conversational and engaging tone
- Preserving the natural flow of spoken language
- Adapting cultural references appropriately
- Keeping episode-specific terminology consistent
- Making content accessible and engaging for podcast listeners

Always respond with ONLY a valid JSON object containing the translated fields.`,
    
    user: (fields: Record<string, string>, targetLang: string) => `
Please translate the following podcast episode content to ${targetLang}. Keep the conversational tone and make it engaging for audio content consumption.

Content to translate:
${JSON.stringify(fields, null, 2)}

Respond with ONLY a JSON object with the same field names containing natural, conversational translations.
`
  },
  
  category: {
    system: `You are a professional translator for user interface and navigation content. Focus on:

- Concise, clear language suitable for UI elements
- Consistent terminology across the interface
- User-friendly and intuitive phrasing
- Navigation clarity for non-native speakers

Always respond with ONLY a valid JSON object containing the translated fields.`,
    
    user: (fields: Record<string, string>, targetLang: string) => `
Please translate the following UI/category content to ${targetLang}. Keep it concise and user-friendly for navigation elements.

Content to translate:
${JSON.stringify(fields, null, 2)}

Respond with ONLY a JSON object with the same field names containing clear, concise translations.
`
  }
}

// Language code to full name mapping
const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'de': 'German (Deutsch)',
  'fr': 'French (Français)',
  'es': 'Spanish (Español)',
  'it': 'Italian (Italiano)',
  'pt': 'Portuguese (Português)',
  'nl': 'Dutch (Nederlands)',
  'ja': 'Japanese (日本語)',
  'ko': 'Korean (한국어)',
  'zh': 'Chinese (中文)'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for admin operations
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

    // Verify request authentication and authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user authentication with the user client
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } }
      }
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Claude API key from Supabase secrets
    const { data: secretData, error: secretError } = await supabaseAdmin
      .from('vault')
      .select('decrypted_secret')
      .eq('name', 'claude-api-key')
      .single()

    const claudeApiKey = secretData?.decrypted_secret || Deno.env.get('CLAUDE_API_KEY')
    if (!claudeApiKey) {
      return new Response(
        JSON.stringify({ error: 'Claude API key not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const requestBody: TranslationRequest = await req.json()
    const { contentId, contentType, targetLanguage, fields, priority = 'medium' } = requestBody

    // Validate request
    if (!contentId || !contentType || !targetLanguage || !fields || fields.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: contentId, contentType, targetLanguage, fields' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate content type
    if (!['insight', 'episode', 'category'].includes(contentType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid contentType. Must be: insight, episode, or category' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate target language
    if (!LANGUAGE_NAMES[targetLanguage]) {
      return new Response(
        JSON.stringify({ error: `Unsupported target language: ${targetLanguage}` }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch original content from database
    let originalContent: Record<string, any> | null = null
    
    switch (contentType) {
      case 'insight':
        const { data: insight } = await supabaseAdmin
          .from('insights')
          .select(fields.join(', '))
          .eq('id', contentId)
          .single()
        originalContent = insight
        break
        
      case 'episode':
        const { data: episode } = await supabaseAdmin
          .from('episodes')
          .select(fields.join(', '))
          .eq('id', contentId)
          .single()
        originalContent = episode
        break
        
      case 'category':
        const { data: category } = await supabaseAdmin
          .from('insights_categories')
          .select(fields.join(', '))
          .eq('id', contentId)
          .single()
        originalContent = category
        break
    }

    if (!originalContent) {
      return new Response(
        JSON.stringify({ error: `Content not found: ${contentId}` }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract fields to translate
    const fieldsToTranslate: Record<string, string> = {}
    for (const field of fields) {
      if (originalContent[field]) {
        fieldsToTranslate[field] = originalContent[field]
      }
    }

    if (Object.keys(fieldsToTranslate).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No translatable content found in specified fields' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if translation already exists
    const translationTable = `${contentType === 'category' ? 'insights_categories' : contentType + 's'}_translations`
    const { data: existingTranslation } = await supabaseAdmin
      .from(translationTable)
      .select('id, translation_status')
      .eq(`${contentType === 'category' ? 'category_id' : contentType + '_id'}`, contentId)
      .eq('language_code', targetLanguage)
      .single()

    // Prepare Claude API request
    const prompt = TRANSLATION_PROMPTS[contentType]
    const requestPayload = {
      model: CLAUDE_MODEL,
      max_tokens: Math.min(4000, Object.values(fieldsToTranslate).join(' ').length * 2),
      temperature: 0.3, // Lower temperature for more consistent translations
      system: prompt.system,
      messages: [
        {
          role: 'user',
          content: prompt.user(fieldsToTranslate, LANGUAGE_NAMES[targetLanguage])
        }
      ]
    }

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
        JSON.stringify({ error: 'Translation service unavailable' }), 
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const claudeData = await claudeResponse.json()
    
    // Extract translation from Claude response
    let translations: Record<string, string>
    try {
      const translationText = claudeData.content[0].text.trim()
      // Remove any markdown formatting that might wrap the JSON
      const jsonMatch = translationText.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : translationText
      translations = JSON.parse(jsonString)
    } catch (error) {
      console.error('Failed to parse Claude response:', claudeData.content[0].text)
      return new Response(
        JSON.stringify({ error: 'Failed to parse translation response' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate costs (Claude 3.5 Haiku pricing)
    const promptTokens = claudeData.usage?.input_tokens || 0
    const completionTokens = claudeData.usage?.output_tokens || 0
    const totalCostUsd = (promptTokens * 0.00008 + completionTokens * 0.00024) / 1000 // Claude 3.5 Haiku pricing

    // Prepare translation record
    const translationRecord = {
      [`${contentType === 'category' ? 'category_id' : contentType + '_id'}`]: contentId,
      language_code: targetLanguage,
      ...translations,
      translation_status: 'completed',
      translation_method: 'ai',
      translation_quality_score: 0.88, // Claude generally produces slightly higher quality
      translated_at: new Date().toISOString(),
      translated_by: user.id,
      claude_model: CLAUDE_MODEL,
      claude_prompt_tokens: promptTokens,
      claude_completion_tokens: completionTokens,
      claude_cost_usd: totalCostUsd,
    }

    // Save or update translation in database
    let translationResult
    if (existingTranslation) {
      // Update existing translation
      const { data, error } = await supabaseAdmin
        .from(translationTable)
        .update(translationRecord)
        .eq('id', existingTranslation.id)
        .select()
        .single()
      
      translationResult = { data, error }
    } else {
      // Insert new translation
      const { data, error } = await supabaseAdmin
        .from(translationTable)
        .insert(translationRecord)
        .select()
        .single()
      
      translationResult = { data, error }
    }

    if (translationResult.error) {
      console.error('Database error:', translationResult.error)
      return new Response(
        JSON.stringify({ error: 'Failed to save translation' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return success response
    const response: TranslationResponse = {
      success: true,
      translationId: translationResult.data.id,
      translations,
      cost: {
        promptTokens,
        completionTokens,
        totalCostUsd
      }
    }

    return new Response(
      JSON.stringify(response), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Claude translation function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})