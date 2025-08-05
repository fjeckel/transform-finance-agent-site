import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

interface TranslationStats {
  language_code: string;
  language_name: string;
  insights_total: number;
  insights_translated: number;
  insights_completion_pct: number;
  episodes_total: number;
  episodes_translated: number;
  episodes_completion_pct: number;
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

    // Try to use the database RPC function first
    const { data: rpcStats, error: rpcError } = await supabaseAdmin
      .rpc('get_translation_stats')

    if (!rpcError && rpcStats) {
      return new Response(
        JSON.stringify(rpcStats), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.warn('RPC function failed, falling back to manual calculation:', rpcError)

    // Get active languages
    const { data: languages, error: languagesError } = await supabaseAdmin
      .from('languages')
      .select('code, name')
      .eq('is_active', true)
      .order('sort_order')

    if (languagesError) {
      console.error('Error fetching languages:', languagesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch languages' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate stats for each language
    const stats: TranslationStats[] = []

    for (const language of languages || []) {
      // Count total published insights
      const { count: insightsTotal } = await supabaseAdmin
        .from('insights')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')

      // Count translated insights
      const { count: insightsTranslated } = await supabaseAdmin
        .from('insights_translations')
        .select('*', { count: 'exact', head: true })
        .eq('language_code', language.code)
        .eq('translation_status', 'completed')

      // Count total published episodes  
      const { count: episodesTotal } = await supabaseAdmin
        .from('episodes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')

      // Count translated episodes
      const { count: episodesTranslated } = await supabaseAdmin
        .from('episodes_translations')
        .select('*', { count: 'exact', head: true })
        .eq('language_code', language.code)
        .eq('translation_status', 'completed')

      const insightsCompletionPct = insightsTotal > 0 ? 
        Math.round((insightsTranslated / insightsTotal) * 100) : 0
      
      const episodesCompletionPct = episodesTotal > 0 ? 
        Math.round((episodesTranslated / episodesTotal) * 100) : 0

      stats.push({
        language_code: language.code,
        language_name: language.name,
        insights_total: insightsTotal || 0,
        insights_translated: insightsTranslated || 0,
        insights_completion_pct: insightsCompletionPct,
        episodes_total: episodesTotal || 0,
        episodes_translated: episodesTranslated || 0,
        episodes_completion_pct: episodesCompletionPct
      })
    }

    return new Response(
      JSON.stringify(stats), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Translation stats function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})