import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Extract token from URL path
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const token = pathParts[pathParts.length - 1]

    if (!token) {
      return new Response('Missing download token', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Validate download token
    const { data: downloadToken, error: tokenError } = await supabase
      .from('download_tokens')
      .select(`
        *,
        purchase:purchases (
          *,
          pdf:downloadable_pdfs (*)
        )
      `)
      .eq('token', token)
      .single()

    if (tokenError || !downloadToken) {
      return new Response('Invalid or expired download token', { 
        status: 404,
        headers: corsHeaders 
      })
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(downloadToken.expires_at)
    
    if (now > expiresAt) {
      return new Response('Download token has expired', { 
        status: 410,
        headers: corsHeaders 
      })
    }

    // Check download limits
    if (downloadToken.download_count >= downloadToken.max_downloads) {
      return new Response('Download limit exceeded', { 
        status: 429,
        headers: corsHeaders 
      })
    }

    // Get client IP and user agent for tracking
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Increment download count and update last accessed
    const { error: updateError } = await supabase
      .from('download_tokens')
      .update({
        download_count: downloadToken.download_count + 1,
        last_accessed_at: now.toISOString(),
        ip_address: clientIP,
        user_agent: userAgent
      })
      .eq('id', downloadToken.id)

    if (updateError) {
      console.error('Error updating download token:', updateError)
    }

    // Get the PDF from storage
    const pdf = downloadToken.purchase.pdf
    
    if (!pdf) {
      return new Response('PDF not found', { 
        status: 404,
        headers: corsHeaders 
      })
    }

    // For premium PDFs, generate signed URL from private storage
    // For now, we'll redirect to the existing public URL, but in production
    // you should store premium PDFs in a private bucket
    
    let fileUrl = pdf.file_url

    if (pdf.is_premium) {
      try {
        // Generate signed URL for private storage
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('premium-pdfs') // This bucket should be private
          .createSignedUrl(`${pdf.id}/${pdf.title}.pdf`, 3600) // 1 hour expiry

        if (urlError) {
          console.error('Error generating signed URL:', urlError)
          // Fallback to public URL if signed URL fails
        } else {
          fileUrl = signedUrlData.signedUrl
        }
      } catch (error) {
        console.error('Error with signed URL generation:', error)
        // Continue with public URL as fallback
      }
    }

    // Log the download attempt
    console.log('Download attempt:', {
      token: token,
      pdf_id: pdf.id,
      pdf_title: pdf.title,
      user_id: downloadToken.purchase.user_id,
      download_count: downloadToken.download_count + 1,
      client_ip: clientIP,
      user_agent: userAgent
    })

    // Redirect to the PDF file
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': fileUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Download handler error:', error)
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    })
  }
})