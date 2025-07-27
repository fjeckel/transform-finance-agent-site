import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pdfId } = await req.json()
    
    console.log('Creating payment link for PDF:', pdfId)

    if (!pdfId) {
      return new Response(
        JSON.stringify({ error: 'Missing pdfId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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

    if (!pdf.is_premium || !pdf.price || pdf.price <= 0) {
      return new Response(
        JSON.stringify({ error: 'PDF is not available for purchase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create or get existing Stripe price
    let priceId = pdf.stripe_price_id

    if (!priceId) {
      // Create new Stripe price
      const price = await stripe.prices.create({
        currency: pdf.currency || 'eur',
        unit_amount: Math.round(pdf.price * 100), // Convert to cents
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

      priceId = price.id

      // Update PDF with Stripe price ID
      await supabase
        .from('downloadable_pdfs')
        .update({ stripe_price_id: priceId })
        .eq('id', pdfId)
    }

    // Create Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      metadata: {
        pdf_id: pdfId,
        pdf_title: pdf.title,
        pdf_file_url: pdf.file_url,
        delivery_type: 'email'
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['DE', 'AT', 'CH', 'FR', 'NL', 'BE', 'US', 'GB', 'CA'],
      },
      tax_id_collection: {
        enabled: true,
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${req.headers.get('origin') || 'https://your-domain.com'}/thank-you?session_id={CHECKOUT_SESSION_ID}&pdf_id=${pdfId}`,
        },
      },
    })

    console.log('Payment link created:', paymentLink.id)

    // Store payment link in database for future use
    await supabase
      .from('downloadable_pdfs')
      .update({ 
        stripe_payment_link_url: paymentLink.url,
        stripe_payment_link_id: paymentLink.id
      })
      .eq('id', pdfId)

    return new Response(
      JSON.stringify({
        paymentLinkUrl: paymentLink.url,
        paymentLinkId: paymentLink.id,
        amount: pdf.price,
        currency: pdf.currency || 'EUR',
        pdfTitle: pdf.title
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Payment link creation error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create payment link', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})