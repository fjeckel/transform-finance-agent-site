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

    // Check if the required tables exist first
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['languages', 'insights_translations', 'episodes_translations'])

    if (tablesError) {
      console.error('Error checking tables:', tablesError)
      return new Response(
        JSON.stringify({ error: 'Failed to check database schema' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const existingTables = tables?.map(t => t.table_name) || []
    
    // If translation tables don't exist, return basic stats
    if (!existingTables.includes('languages') || 
        !existingTables.includes('insights_translations') || 
        !existingTables.includes('episodes_translations')) {
      
      const stats: TranslationStats[] = [
        {
          language_code: 'de',
          language_name: 'German',
          insights_total: 0,
          insights_translated: 0,
          insights_completion_pct: 0,
          episodes_total: 0,
          episodes_translated: 0,
          episodes_completion_pct: 0
        },
        {
          language_code: 'en',
          language_name: 'English',
          insights_total: 0,
          insights_translated: 0,
          insights_completion_pct: 0,
          episodes_total: 0,
          episodes_translated: 0,
          episodes_completion_pct: 0
        }
      ];

      return new Response(
        JSON.stringify(stats), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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