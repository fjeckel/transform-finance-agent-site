import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RateLimitRequest {
  key: string;
  maxAttempts?: number;
  windowMs?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { key, maxAttempts = 5, windowMs = 300000 } = await req.json() as RateLimitRequest;

    if (!key) {
      return new Response(
        JSON.stringify({ error: 'Key is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing attempts from the database
    const { data: existingAttempts, error: fetchError } = await supabaseClient
      .from('rate_limit_attempts')
      .select('*')
      .eq('key', key)
      .gte('attempted_at', new Date(windowStart).toISOString())
      .order('attempted_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching rate limit attempts:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const attemptCount = existingAttempts?.length || 0;

    if (attemptCount >= maxAttempts) {
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          remainingAttempts: 0,
          resetTime: windowStart + windowMs 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Record this attempt
    const { error: insertError } = await supabaseClient
      .from('rate_limit_attempts')
      .insert([{ key, attempted_at: new Date().toISOString() }]);

    if (insertError) {
      console.error('Error inserting rate limit attempt:', insertError);
    }

    // Clean up old attempts (optional, could be done via a scheduled job)
    await supabaseClient
      .from('rate_limit_attempts')
      .delete()
      .eq('key', key)
      .lt('attempted_at', new Date(windowStart).toISOString());

    return new Response(
      JSON.stringify({ 
        allowed: true, 
        remainingAttempts: maxAttempts - attemptCount - 1,
        resetTime: now + windowMs 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Rate limit function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})