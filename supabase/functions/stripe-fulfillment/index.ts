import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://aumijfxmeclxweojrefa.supabase.co',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Credentials': 'true',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing stripe-signature header')
      return new Response('Missing stripe-signature header', { status: 400 })
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable')
      return new Response('Webhook secret not configured', { status: 500 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    console.log('Processing webhook event:', event.type, event.id)

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(supabase, session, stripe)
        break
      }

      case 'payment_link.payment_succeeded': {
        const paymentLink = event.data.object as any
        await handlePaymentLinkSuccess(supabase, paymentLink)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Webhook handler error',
        details: error.message 
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session, stripe: Stripe) {
  const startTime = Date.now()
  
  try {
    console.log('Processing completed checkout session:', session.id)

    // Get customer details
    const customerEmail = session.customer_details?.email
    if (!customerEmail) {
      console.error('No customer email in checkout session')
      return
    }

    // Extract PDF metadata from payment link or line items
    let pdfId: string | undefined
    let pdfTitle: string | undefined
    let pdfFileUrl: string | undefined

    // Try to get metadata from the session
    if (session.metadata) {
      pdfId = session.metadata.pdf_id
      pdfTitle = session.metadata.pdf_title
      pdfFileUrl = session.metadata.pdf_file_url
    }

    // If not in session metadata, try to get from line items
    if (!pdfId && session.line_items) {
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product']
        })
        
        if (lineItems.data.length > 0) {
          const product = lineItems.data[0].price?.product as Stripe.Product
          if (product?.metadata) {
            pdfId = product.metadata.pdf_id
            pdfTitle = product.name
          }
        }
      } catch (error) {
        console.error('Error fetching line items:', error)
      }
    }

    if (!pdfId) {
      console.error('No PDF ID found in checkout session or metadata')
      return
    }

    // Get PDF details from database
    const { data: pdf, error: pdfError } = await supabase
      .from('downloadable_pdfs')
      .select('*')
      .eq('id', pdfId)
      .single()

    if (pdfError || !pdf) {
      console.error('PDF not found:', pdfError)
      return
    }

    // Create purchase record for tracking (no user required)
    const purchaseData = {
      customer_email: customerEmail,
      pdf_id: pdfId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      amount_paid: (session.amount_total || 0) / 100,
      currency: session.currency?.toUpperCase() || 'EUR',
      status: 'completed',
      purchased_at: new Date().toISOString(),
      customer_name: session.customer_details?.name || null,
      customer_country: session.customer_details?.address?.country || null,
    }

    const { data: purchase, error: purchaseError } = await supabase
      .from('email_purchases')
      .insert(purchaseData)
      .select('*')
      .single()

    if (purchaseError) {
      console.error('Error creating purchase record:', purchaseError)
      // Continue with email delivery even if database insert fails
    }

    // Send PDF via email
    const emailResult = await sendPdfEmail({
      supabase,
      customerEmail,
      pdfTitle: pdf.title,
      orderId: session.id,
      amount: (session.amount_total || 0) / 100,
      currency: session.currency?.toUpperCase() || 'EUR',
      pdfFileUrl: pdf.file_url,
      purchaseId: purchase?.id
    })

    // Log success metrics
    const processingTime = Date.now() - startTime
    console.log('Successfully processed checkout session:', {
      sessionId: session.id,
      customerEmail,
      pdfTitle: pdf.title,
      processingTimeMs: processingTime,
      emailSent: emailResult
    })

  } catch (error) {
    console.error('Error handling checkout session completed:', error)
  }
}

async function handlePaymentLinkSuccess(supabase: any, paymentLink: any) {
  try {
    console.log('Processing payment link success:', paymentLink.id)
    // Payment links will create checkout sessions, so the main handling is in checkout.session.completed
  } catch (error) {
    console.error('Error handling payment link success:', error)
  }
}

async function sendPdfEmail({
  supabase,
  customerEmail,
  pdfTitle,
  orderId,
  amount,
  currency,
  pdfFileUrl,
  purchaseId
}: {
  supabase: any
  customerEmail: string
  pdfTitle: string
  orderId: string
  amount: number
  currency: string
  pdfFileUrl?: string
  purchaseId?: string
}): Promise<boolean> {
  try {
    // Create secure download URL if needed
    let downloadUrl: string | undefined
    
    if (pdfFileUrl && purchaseId) {
      // Generate time-limited download URL
      downloadUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/secure-download/${purchaseId}?token=${generateDownloadToken(purchaseId)}`
    }

    // Call email delivery service
    const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/email-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        customerEmail,
        pdfTitle,
        orderId,
        amount,
        currency,
        downloadUrl
      })
    })

    if (!emailResponse.ok) {
      throw new Error(`Email service responded with ${emailResponse.status}`)
    }

    const result = await emailResponse.json()
    console.log('Email delivery result:', result)

    return result.success || false

  } catch (error) {
    console.error('Error sending PDF email:', error)
    return false
  }
}

function generateDownloadToken(purchaseId: string): string {
  // Simple token generation - in production, use a more secure method
  const timestamp = Date.now().toString()
  const hash = btoa(purchaseId + timestamp).replace(/[^a-zA-Z0-9]/g, '')
  return hash.substring(0, 32)
}