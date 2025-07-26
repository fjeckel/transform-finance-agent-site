import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

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
    const { pdfId, userId, successUrl, cancelUrl } = await req.json()

    // Validate inputs
    if (!pdfId || !userId || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured')
    }
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    // Get PDF details
    const { data: pdf, error: pdfError } = await supabase
      .from('downloadable_pdfs')
      .select('*')
      .eq('id', pdfId)
      .single()

    if (pdfError || !pdf) {
      return new Response(
        JSON.stringify({ error: 'PDF not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if it's premium content
    if (!pdf.is_premium || !pdf.price || pdf.price <= 0) {
      return new Response(
        JSON.stringify({ error: 'PDF is not premium content' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate payment amount against Stripe limits
    const currency = pdf.currency || 'eur'
    const minimumAmount = currency.toLowerCase() === 'eur' ? 0.50 : 0.50 // EUR minimum
    const maximumAmount = 999999.99 // Stripe maximum
    
    if (pdf.price < minimumAmount) {
      return new Response(
        JSON.stringify({ 
          error: `Price must be at least ${minimumAmount} ${currency.toUpperCase()}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (pdf.price > maximumAmount) {
      return new Response(
        JSON.stringify({ 
          error: `Price cannot exceed ${maximumAmount} ${currency.toUpperCase()}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user already purchased this PDF
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('pdf_id', pdfId)
      .eq('status', 'completed')
      .single()

    if (existingPurchase) {
      return new Response(
        JSON.stringify({ error: 'User has already purchased this PDF' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user details
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create or get Stripe customer
    let stripeCustomerId: string
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (existingCustomer) {
      stripeCustomerId = existingCustomer.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: userId,
        },
      })

      // Save customer to database
      await supabase
        .from('stripe_customers')
        .insert({
          user_id: userId,
          stripe_customer_id: customer.id,
          email: user.email,
        })

      stripeCustomerId = customer.id
    }

    // Create preliminary purchase record (will be completed by webhook)
    const { data: preliminaryPurchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        pdf_id: pdfId,
        amount_paid: pdf.price,
        currency: pdf.currency || 'eur',
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (purchaseError) {
      console.error('Error creating preliminary purchase:', purchaseError)
      return new Response(
        JSON.stringify({ error: 'Failed to create purchase record' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Stripe Checkout Session with enhanced configuration
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card', 'sepa_debit'], // Support SEPA for European customers
      line_items: [
        {
          price_data: {
            currency: pdf.currency || 'eur',
            product_data: {
              name: pdf.title,
              description: pdf.description || 'Premium PDF Report',
              images: pdf.image_url ? [pdf.image_url] : [],
              metadata: {
                pdf_id: pdfId,
                content_type: 'premium_pdf',
              },
            },
            unit_amount: Math.round(pdf.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        pdf_id: pdfId,
        user_id: userId,
        pdf_title: pdf.title,
        purchase_id: preliminaryPurchase.id,
        product_type: 'premium_pdf',
        version: 'v2', // For tracking implementation versions
      },
      allow_promotion_codes: true, // Enable promo codes
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['DE', 'AT', 'CH', 'FR', 'NL', 'BE'], // European focus
      },
      tax_id_collection: {
        enabled: true, // Collect VAT numbers for business customers
      },
      payment_intent_data: {
        metadata: {
          pdf_id: pdfId,
          user_id: userId,
          pdf_title: pdf.title,
          purchase_id: preliminaryPurchase.id,
          product_type: 'premium_pdf',
        },
        description: `Premium PDF: ${pdf.title}`,
        statement_descriptor: 'FINANCE*REPORT', // 22 chars max, shows on bank statement
      },
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes expiry
    })

    // Update purchase record with checkout session ID
    const { error: updateError } = await supabase
      .from('purchases')
      .update({ 
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', preliminaryPurchase.id)

    if (updateError) {
      console.error('Error updating purchase with session ID:', updateError)
      // Continue anyway - webhook can still process this
    }

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})