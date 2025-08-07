import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    const { sessionId, pdfId } = await req.json()

    if (!sessionId || !pdfId) {
      return new Response(
        JSON.stringify({ error: 'Missing sessionId or pdfId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find the purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('email_purchases')
      .select('*')
      .eq('stripe_checkout_session_id', sessionId)
      .single()

    if (purchaseError || !purchase) {
      console.error('Purchase not found:', purchaseError)
      return new Response(
        JSON.stringify({ error: 'Purchase record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get PDF details
    const { data: pdf, error: pdfError } = await supabase
      .from('downloadable_pdfs')
      .select('*')
      .eq('id', pdfId)
      .single()

    if (pdfError || !pdf) {
      console.error('PDF not found:', pdfError)
      return new Response(
        JSON.stringify({ error: 'PDF not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create secure download URL
    const downloadUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/secure-download/${purchase.id}?token=${generateDownloadToken(purchase.id)}`

    // Call email delivery service
    const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/email-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        customerEmail: purchase.customer_email,
        pdfTitle: pdf.title,
        orderId: purchase.stripe_checkout_session_id,
        amount: purchase.amount_paid,
        currency: purchase.currency,
        downloadUrl
      })
    })

    if (!emailResponse.ok) {
      throw new Error(`Email service responded with ${emailResponse.status}`)
    }

    const result = await emailResponse.json()
    
    if (result.success) {
      // Update last resent timestamp
      await supabase
        .from('email_purchases')
        .update({ 
          last_email_resent_at: new Date().toISOString(),
          email_resend_count: (purchase.email_resend_count || 0) + 1
        })
        .eq('id', purchase.id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email resent successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      throw new Error('Email delivery failed')
    }

  } catch (error) {
    console.error('Resend email error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to resend email', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateDownloadToken(purchaseId: string): string {
  // Simple token generation - in production, use a more secure method
  const timestamp = Date.now().toString()
  const hash = btoa(purchaseId + timestamp).replace(/[^a-zA-Z0-9]/g, '')
  return hash.substring(0, 32)
}