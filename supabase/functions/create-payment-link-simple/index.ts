import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Payment Link Creation Started ===')
    
    // Parse request body
    let body
    try {
      body = await req.json()
    } catch (e) {
      console.error('Failed to parse request body:', e)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { pdfId } = body
    console.log('PDF ID received:', pdfId)

    if (!pdfId) {
      console.error('Missing pdfId in request')
      return new Response(
        JSON.stringify({ error: 'Missing pdfId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check environment variables
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!stripeKey) {
      console.error('Missing STRIPE_SECRET_KEY environment variable')
      return new Response(
        JSON.stringify({ error: 'Stripe configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Database configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize services
    console.log('Initializing Stripe and Supabase...')
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get PDF details
    console.log('Fetching PDF details for:', pdfId)
    const { data: pdf, error: pdfError } = await supabase
      .from('downloadable_pdfs')
      .select('*')
      .eq('id', pdfId)
      .single()

    if (pdfError) {
      console.error('Database error fetching PDF:', pdfError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch PDF details', details: pdfError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!pdf) {
      console.error('PDF not found with ID:', pdfId)
      return new Response(
        JSON.stringify({ error: 'PDF not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('PDF found:', { id: pdf.id, title: pdf.title, price: pdf.price, is_premium: pdf.is_premium })

    // Check if it's a premium PDF
    if (!pdf.is_premium || !pdf.price || pdf.price <= 0) {
      console.error('PDF is not premium or has no price:', { is_premium: pdf.is_premium, price: pdf.price })
      return new Response(
        JSON.stringify({ error: 'PDF is not available for purchase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if payment link already exists
    if (pdf.stripe_payment_link_url) {
      console.log('Using existing payment link:', pdf.stripe_payment_link_url)
      return new Response(
        JSON.stringify({
          paymentLinkUrl: pdf.stripe_payment_link_url,
          paymentLinkId: pdf.stripe_payment_link_id,
          amount: pdf.price,
          currency: pdf.currency || 'EUR',
          pdfTitle: pdf.title,
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Stripe price first
    console.log('Creating Stripe price...')
    const price = await stripe.prices.create({
      currency: (pdf.currency || 'eur').toLowerCase(),
      unit_amount: Math.round(pdf.price * 100),
      product_data: {
        name: pdf.title,
        description: pdf.description || 'Premium PDF Report',
        images: pdf.image_url ? [pdf.image_url] : [],
        metadata: {
          pdf_id: pdfId,
          type: 'digital_download'
        }
      },
      metadata: {
        pdf_id: pdfId,
        pdf_title: pdf.title
      }
    })

    console.log('Stripe price created:', price.id)

    // Create Payment Link
    console.log('Creating payment link...')
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{
        price: price.id,
        quantity: 1,
      }],
      metadata: {
        pdf_id: pdfId,
        pdf_title: pdf.title,
        pdf_file_url: pdf.file_url || '',
        delivery_type: 'email'
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${req.headers.get('origin') || 'https://your-domain.com'}/thank-you?session_id={CHECKOUT_SESSION_ID}&pdf_id=${pdfId}`,
        },
      },
    })

    console.log('Payment link created:', paymentLink.id, paymentLink.url)

    // Save payment link to database
    console.log('Saving payment link to database...')
    const { error: updateError } = await supabase
      .from('downloadable_pdfs')
      .update({
        stripe_price_id: price.id,
        stripe_payment_link_url: paymentLink.url,
        stripe_payment_link_id: paymentLink.id
      })
      .eq('id', pdfId)

    if (updateError) {
      console.error('Failed to save payment link to database:', updateError)
      // Don't fail the request, just log the error
    }

    console.log('=== Payment Link Creation Completed Successfully ===')

    return new Response(
      JSON.stringify({
        paymentLinkUrl: paymentLink.url,
        paymentLinkId: paymentLink.id,
        priceId: price.id,
        amount: pdf.price,
        currency: pdf.currency || 'EUR',
        pdfTitle: pdf.title,
        success: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('=== Payment Link Creation Failed ===')
    console.error('Error details:', error)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({
        error: 'Payment link creation failed',
        message: error.message,
        type: error.constructor.name,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})