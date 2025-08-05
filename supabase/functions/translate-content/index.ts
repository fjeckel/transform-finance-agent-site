import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

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

// OpenAI API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_MODEL = 'gpt-4o-mini' // Cost-effective model for translations

// Translation prompts by content type
const TRANSLATION_PROMPTS = {
  insight: {
    system: `You are a professional translator specializing in financial and business content. 
Translate the following content accurately while maintaining:
- Technical terminology consistency
- Professional tone
- Cultural appropriateness for business context
- Original formatting (markdown, etc.)

Provide translations in valid JSON format only.`,
    
    user: (fields: Record<string, string>, targetLang: string) => `
Translate the following fields to ${targetLang}:
${JSON.stringify(fields, null, 2)}

Return ONLY a JSON object with the same field names containing the translations.
Example: {"title": "Translated title", "content": "Translated content"}
`
  },
  
  episode: {
    system: `You are a professional translator for podcast content. 
Translate while maintaining:
- Natural speaking tone
- Episode-specific terminology
- Cultural context for the target audience
- Engaging and accessible language

Provide translations in valid JSON format only.`,
    
    user: (fields: Record<string, string>, targetLang: string) => `
Translate the following podcast episode fields to ${targetLang}:
${JSON.stringify(fields, null, 2)}

Return ONLY a JSON object with the same field names containing the translations.
`
  },
  
  category: {
    system: `You are a professional translator for UI/UX content.
Translate while maintaining:
- Concise, clear language
- Consistent terminology
- User-friendly tone
- Navigation clarity

Provide translations in valid JSON format only.`,
    
    user: (fields: Record<string, string>, targetLang: string) => `
Translate the following category fields to ${targetLang}:
${JSON.stringify(fields, null, 2)}

Return ONLY a JSON object with the same field names containing the translations.
`
  }
}

// Language code to full name mapping
const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'de': 'German',
  'fr': 'French',
  'es': 'Spanish',
  'it': 'Italian',
  'pt': 'Portuguese',
  'nl': 'Dutch',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese'
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

    // TODO: Add role-based authorization check here
    // For now, any authenticated user can use translation (will be restricted in production)

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }), 
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

    // Helper function to strip HTML tags but preserve text
    const stripHtml = (html: string): string => {
      return html
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim()
    }

    // Extract fields to translate and strip HTML
    const fieldsToTranslate: Record<string, string> = {}
    const originalHtmlFields: Record<string, string> = {}
    
    for (const field of fields) {
      if (originalContent[field]) {
        const originalValue = originalContent[field]
        originalHtmlFields[field] = originalValue
        // Strip HTML for translation but keep the original for structure reference
        fieldsToTranslate[field] = stripHtml(originalValue)
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

    // Prepare OpenAI API request
    const prompt = TRANSLATION_PROMPTS[contentType]
    const requestPayload = {
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user(fieldsToTranslate, LANGUAGE_NAMES[targetLanguage]) }
      ],
      temperature: 0.3, // Lower temperature for more consistent translations
      max_tokens: Math.min(4000, Object.values(fieldsToTranslate).join(' ').length * 2), // Estimate based on content length
    }

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
        JSON.stringify({ error: 'Translation service unavailable' }), 
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiData = await openaiResponse.json()
    
    // Extract translation from OpenAI response
    let translations: Record<string, string>
    try {
      const translationText = openaiData.choices[0].message.content.trim()
      // Remove any markdown formatting that might wrap the JSON
      const jsonMatch = translationText.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : translationText
      translations = JSON.parse(jsonString)
    } catch (error) {
      console.error('Failed to parse OpenAI response:', openaiData.choices[0].message.content)
      return new Response(
        JSON.stringify({ error: 'Failed to parse translation response' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate costs (rough estimation based on GPT-4o-mini pricing)
    const promptTokens = openaiData.usage?.prompt_tokens || 0
    const completionTokens = openaiData.usage?.completion_tokens || 0
    const totalCostUsd = (promptTokens * 0.00015 + completionTokens * 0.0006) / 1000 // GPT-4o-mini pricing

    // Helper function to preserve HTML structure when possible
    const preserveHtmlStructure = (originalHtml: string, translatedText: string): string => {
      // If original had HTML, try to preserve basic structure
      if (originalHtml.includes('<') && originalHtml.includes('>')) {
        // Simple strategy: if original starts/ends with tags, preserve them
        const startTagMatch = originalHtml.match(/^<[^>]*>/)
        const endTagMatch = originalHtml.match(/<\/[^>]*>$/)
        
        if (startTagMatch && endTagMatch) {
          return startTagMatch[0] + translatedText + endTagMatch[0]
        }
        
        // For more complex HTML, return plain text (safer)
        return translatedText
      }
      return translatedText
    }

    // Preserve HTML structure in translations where possible
    const finalTranslations: Record<string, string> = {}
    for (const [field, translatedText] of Object.entries(translations)) {
      if (originalHtmlFields[field]) {
        finalTranslations[field] = preserveHtmlStructure(originalHtmlFields[field], translatedText)
      } else {
        finalTranslations[field] = translatedText
      }
    }

    // Prepare translation record
    const translationRecord = {
      [`${contentType === 'category' ? 'category_id' : contentType + '_id'}`]: contentId,
      language_code: targetLanguage,
      ...finalTranslations,
      translation_status: 'completed',
      translation_method: 'ai',
      translation_quality_score: 0.85, // Default AI quality score, can be improved with quality assessment
      translated_at: new Date().toISOString(),
      translated_by: user.id,
      openai_model: OPENAI_MODEL,
      openai_prompt_tokens: promptTokens,
      openai_completion_tokens: completionTokens,
      openai_cost_usd: totalCostUsd,
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
      translations: finalTranslations,
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
    console.error('Translation function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})