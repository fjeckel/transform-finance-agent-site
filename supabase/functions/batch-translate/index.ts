import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface BatchTranslationRequest {
  contentType: 'insight' | 'episode' | 'category'
  targetLanguage: string
  contentIds?: string[] // Specific IDs to translate, or omit for all
  fields: string[] // Fields to translate
  priority?: 'high' | 'medium' | 'low'
  maxItems?: number // Limit batch size (default: 10)
}

interface BatchTranslationResponse {
  success: boolean
  totalRequested: number
  totalProcessed: number
  totalSkipped: number
  translations: Array<{
    contentId: string
    success: boolean
    translationId?: string
    error?: string
    cost?: number
  }>
  totalCostUsd: number
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase clients
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

    // Authentication check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request
    const requestBody: BatchTranslationRequest = await req.json()
    const { 
      contentType, 
      targetLanguage, 
      contentIds, 
      fields, 
      priority = 'medium',
      maxItems = 10 
    } = requestBody

    // Validation
    if (!contentType || !targetLanguage || !fields || fields.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get content to translate
    let contentQuery
    const tableName = contentType === 'category' ? 'insights_categories' : `${contentType}s`
    
    if (contentIds && contentIds.length > 0) {
      // Translate specific items
      contentQuery = supabaseAdmin
        .from(tableName)
        .select(`id, ${fields.join(', ')}`)
        .in('id', contentIds.slice(0, maxItems))
    } else {
      // Translate all published content that doesn't have translations yet
      const translationTable = `${contentType === 'category' ? 'insights_categories' : contentType + 's'}_translations`
      
      // First get content that doesn't have translations
      const { data: existingTranslations } = await supabaseAdmin
        .from(translationTable)
        .select(`${contentType === 'category' ? 'category_id' : contentType + '_id'}`)
        .eq('language_code', targetLanguage)
      
      const existingIds = existingTranslations?.map(t => 
        t[contentType === 'category' ? 'category_id' : contentType + '_id']
      ) || []

      contentQuery = supabaseAdmin
        .from(tableName)
        .select(`id, ${fields.join(', ')}`)
        .not('id', 'in', `(${existingIds.length > 0 ? existingIds.join(',') : 'null'})`)
        .limit(maxItems)

      // For insights and episodes, only get published content
      if (contentType !== 'category') {
        contentQuery = contentQuery.eq('status', 'published')
      }
    }

    const { data: contentItems, error: contentError } = await contentQuery
    
    if (contentError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch content' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!contentItems || contentItems.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          totalRequested: 0,
          totalProcessed: 0,
          totalSkipped: 0,
          translations: [],
          totalCostUsd: 0,
          message: 'No content found to translate'
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process translations with rate limiting
    const results: Array<{
      contentId: string
      success: boolean
      translationId?: string
      error?: string
      cost?: number
    }> = []

    let totalCost = 0
    let processed = 0
    let skipped = 0

    for (const item of contentItems) {
      try {
        // Call individual translation function
        const translationResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/translate-content`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentId: item.id,
            contentType,
            targetLanguage,
            fields,
            priority
          })
        })

        if (translationResponse.ok) {
          const translationData = await translationResponse.json()
          
          if (translationData.success) {
            results.push({
              contentId: item.id,
              success: true,
              translationId: translationData.translationId,
              cost: translationData.cost?.totalCostUsd || 0
            })
            totalCost += translationData.cost?.totalCostUsd || 0
            processed++
          } else {
            results.push({
              contentId: item.id,
              success: false,
              error: translationData.error
            })
            skipped++
          }
        } else {
          const errorText = await translationResponse.text()
          results.push({
            contentId: item.id,
            success: false,
            error: `Translation failed: ${errorText}`
          })
          skipped++
        }

        // Add small delay to avoid rate limiting
        if (contentItems.indexOf(item) < contentItems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }

      } catch (error) {
        results.push({
          contentId: item.id,
          success: false,
          error: `Processing error: ${error.message}`
        })
        skipped++
      }
    }

    const response: BatchTranslationResponse = {
      success: true,
      totalRequested: contentItems.length,
      totalProcessed: processed,
      totalSkipped: skipped,
      translations: results,
      totalCostUsd: totalCost
    }

    return new Response(
      JSON.stringify(response), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Batch translation error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        totalRequested: 0,
        totalProcessed: 0,
        totalSkipped: 0,
        translations: [],
        totalCostUsd: 0
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})