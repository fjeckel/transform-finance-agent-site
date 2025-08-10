import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  try {
    // This function is designed to be called by a cron job or webhook
    console.log('Starting automated YouTube video sync...')
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Call our existing youtube-videos function to fetch latest videos
    const { data, error } = await supabaseClient.functions.invoke('youtube-videos', {
      method: 'GET',
      body: JSON.stringify({ action: 'fetch', limit: 50 }) // Fetch more videos for sync
    })

    if (error) {
      console.error('Error calling youtube-videos function:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('YouTube video sync completed successfully')
    console.log(`Processed ${data?.count || 0} videos`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Video sync completed',
        videosProcessed: data?.count || 0,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('YouTube sync error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})