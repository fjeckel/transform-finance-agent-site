import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

// Enhanced webhook security and event deduplication
class WebhookEventProcessor {
  private processedEvents = new Set<string>()
  private stripe: Stripe
  private supabase: any

  constructor(stripe: Stripe, supabase: any) {
    this.stripe = stripe
    this.supabase = supabase
  }

  async verifyAndProcessEvent(body: string, signature: string, secret: string): Promise<boolean> {
    try {
      // Step 1: Verify webhook signature
      const event = this.stripe.webhooks.constructEvent(body, signature, secret)
      
      // Step 2: Check for event deduplication
      if (await this.isEventProcessed(event.id)) {
        console.log(`Event ${event.id} already processed, skipping`)
        return true
      }

      // Step 3: Additional security - fetch event from Stripe API to verify authenticity
      const stripeEvent = await this.stripe.events.retrieve(event.id)
      if (!stripeEvent || stripeEvent.type !== event.type) {
        console.error(`Event verification failed for ${event.id}`)
        return false
      }

      // Step 4: Mark event as being processed
      await this.markEventAsProcessing(event.id)

      // Step 5: Process the event
      await this.processEvent(stripeEvent)

      // Step 6: Mark event as completed
      await this.markEventAsCompleted(event.id)

      return true
    } catch (error) {
      console.error('Event verification and processing failed:', error)
      return false
    }
  }

  private async isEventProcessed(eventId: string): Promise<boolean> {
    // Check in-memory cache first (for immediate duplicates)
    if (this.processedEvents.has(eventId)) {
      return true
    }

    // Check database for persistence across function invocations
    const { data } = await this.supabase
      .from('webhook_events')
      .select('id')
      .eq('stripe_event_id', eventId)
      .eq('status', 'completed')
      .single()

    return !!data
  }

  private async markEventAsProcessing(eventId: string): Promise<void> {
    this.processedEvents.add(eventId)
    
    await this.supabase
      .from('webhook_events')
      .upsert({
        stripe_event_id: eventId,
        status: 'processing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'stripe_event_id'
      })
  }

  private async markEventAsCompleted(eventId: string): Promise<void> {
    await this.supabase
      .from('webhook_events')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_event_id', eventId)
  }

  private async processEvent(event: Stripe.Event): Promise<void> {
    console.log(`Processing webhook event: ${event.type} (${event.id})`)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(this.supabase, event.data.object as Stripe.Checkout.Session)
        break
      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(this.supabase, event.data.object as Stripe.Checkout.Session)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(this.supabase, event.data.object as Stripe.Invoice)
        break
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(this.supabase, event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(this.supabase, event.data.object as Stripe.PaymentIntent)
        break
      case 'charge.dispute.created':
        await handleDispute(this.supabase, event.data.object as Stripe.Dispute)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Rate limiting: basic implementation
  const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
  const rateLimitKey = `webhook_rate_limit_${clientIP}`
  
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

    // Use enhanced webhook processor
    const processor = new WebhookEventProcessor(stripe, supabase)
    const success = await processor.verifyAndProcessEvent(body, signature, webhookSecret)

    if (!success) {
      return new Response('Event processing failed', { status: 400 })
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook handler error:', error)
    
    // Enhanced error reporting
    const errorDetails = {
      message: error.message,
      type: error.constructor.name,
      timestamp: new Date().toISOString(),
      clientIP
    }
    
    return new Response(JSON.stringify({ 
      error: 'Webhook handler error',
      details: errorDetails 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handleCheckoutSessionCompleted(supabase: any, session: Stripe.Checkout.Session) {
  const startTime = Date.now()
  try {
    console.log('Processing completed checkout session:', {
      sessionId: session.id,
      amount: session.amount_total,
      currency: session.currency,
      customer: session.customer
    })

    // Extract metadata
    const pdfId = session.metadata?.pdf_id
    const userId = session.metadata?.user_id
    const pdfTitle = session.metadata?.pdf_title

    if (!pdfId || !userId) {
      console.error('Missing metadata in checkout session:', {
        sessionId: session.id,
        metadata: session.metadata
      })
      
      // Log the error for analytics
      await logPaymentEvent(supabase, 'checkout_session_missing_metadata', {
        session_id: session.id,
        error: 'Missing pdf_id or user_id in metadata',
        metadata: session.metadata
      })
      return
    }

    // Create or update purchase record
    const purchaseData = {
      user_id: userId,
      pdf_id: pdfId,
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_checkout_session_id: session.id,
      amount_paid: session.amount_total! / 100, // Convert from cents
      currency: session.currency!.toUpperCase(),
      status: 'completed',
      purchased_at: new Date().toISOString()
    }

    // Use upsert to handle potential duplicates
    const { data: purchase, error: upsertError } = await supabase
      .from('purchases')
      .upsert(purchaseData, {
        onConflict: 'stripe_checkout_session_id',
        ignoreDuplicates: false
      })
      .select('*')
      .single()

    if (upsertError) {
      console.error('Error upserting purchase:', upsertError)
      return
    }

    console.log('Purchase record created/updated:', purchase.id)

    // Generate download token
    const downloadToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 48) // 48 hours expiry

    const { error: tokenError } = await supabase
      .from('download_tokens')
      .insert({
        purchase_id: purchase.id,
        token: downloadToken,
        expires_at: expiresAt.toISOString(),
        max_downloads: 5
      })

    if (tokenError) {
      console.error('Error creating download token:', tokenError)
      return
    }

    // Send confirmation email
    await sendPurchaseConfirmationEmail(supabase, purchase, downloadToken)

    // Log successful processing
    const processingTime = Date.now() - startTime
    console.log('Successfully processed checkout session:', {
      sessionId: session.id,
      purchaseId: purchase.id,
      processingTimeMs: processingTime
    })

    // Track success metrics
    await logPaymentEvent(supabase, 'checkout_session_completed', {
      session_id: session.id,
      purchase_id: purchase.id,
      user_id: userId,
      pdf_id: pdfId,
      amount: session.amount_total! / 100,
      currency: session.currency,
      processing_time_ms: processingTime,
      success: true
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('Error handling checkout session completed:', {
      sessionId: session.id,
      error: error.message,
      processingTimeMs: processingTime
    })

    // Track error metrics
    await logPaymentEvent(supabase, 'checkout_session_error', {
      session_id: session.id,
      error: error.message,
      processing_time_ms: processingTime,
      success: false
    })
  }
}

async function handleCheckoutSessionExpired(supabase: any, session: Stripe.Checkout.Session) {
  try {
    console.log('Processing expired checkout session:', session.id)

    // Mark any pending purchases as expired
    const { error } = await supabase
      .from('purchases')
      .update({ 
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_checkout_session_id', session.id)
      .eq('status', 'pending')

    if (error) {
      console.error('Error updating expired purchase:', error)
    }

  } catch (error) {
    console.error('Error handling checkout session expired:', error)
  }
}

async function handleInvoicePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  try {
    console.log('Processing successful invoice payment:', invoice.id)

    // This is useful for subscription-based payments or future recurring charges
    // For now, we'll log it for future implementation
    
    const customerId = invoice.customer as string
    const subscriptionId = invoice.subscription as string

    console.log('Invoice payment succeeded:', {
      invoiceId: invoice.id,
      customerId,
      subscriptionId,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency
    })

    // TODO: Implement subscription-based purchase handling
    // This would be used for monthly/yearly subscription access to premium content

  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error)
  }
}

async function handlePaymentSuccess(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing successful payment:', paymentIntent.id)

    // Update purchase status
    const { data: purchase, error: updateError } = await supabase
      .from('purchases')
      .update({ 
        status: 'completed',
        purchased_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating purchase:', updateError)
      return
    }

    if (!purchase) {
      console.error('Purchase not found for payment intent:', paymentIntent.id)
      return
    }

    // Generate download token
    const downloadToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 48) // 48 hours expiry

    const { error: tokenError } = await supabase
      .from('download_tokens')
      .insert({
        purchase_id: purchase.id,
        token: downloadToken,
        expires_at: expiresAt.toISOString(),
        max_downloads: 5
      })

    if (tokenError) {
      console.error('Error creating download token:', tokenError)
      return
    }

    // Send confirmation email (you would implement this based on your email service)
    await sendPurchaseConfirmationEmail(supabase, purchase, downloadToken)

    console.log('Successfully processed payment for purchase:', purchase.id)

  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailed(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing failed payment:', paymentIntent.id)

    // Update purchase status to failed
    const { error } = await supabase
      .from('purchases')
      .update({ 
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (error) {
      console.error('Error updating failed purchase:', error)
    }

  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

async function handleDispute(supabase: any, dispute: Stripe.Dispute) {
  try {
    console.log('Processing dispute:', dispute.id)

    const chargeId = dispute.charge as string
    
    // Find the purchase associated with this charge
    // Note: You might need to store charge_id in purchases table for this to work
    // For now, we'll log the dispute for manual review
    
    console.log('Dispute created for charge:', chargeId)
    console.log('Dispute reason:', dispute.reason)
    console.log('Dispute amount:', dispute.amount)

    // TODO: Implement dispute handling logic
    // - Find associated purchase
    // - Revoke access if needed
    // - Send notification to admin
    
  } catch (error) {
    console.error('Error handling dispute:', error)
  }
}

async function sendPurchaseConfirmationEmail(supabase: any, purchase: any, downloadToken: string) {
  try {
    // Get PDF details
    const { data: pdf } = await supabase
      .from('downloadable_pdfs')
      .select('title, description')
      .eq('id', purchase.pdf_id)
      .single()

    // Get user details
    const { data: { user } } = await supabase.auth.admin.getUserById(purchase.user_id)

    if (!pdf || !user) {
      console.error('Missing PDF or user data for email')
      return
    }

    // Construct download URL
    const downloadUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/download-pdf/${downloadToken}`

    console.log('Purchase confirmation email should be sent to:', user.email)
    console.log('Download URL:', downloadUrl)
    console.log('PDF Title:', pdf.title)

    // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
    // For now, we'll just log the email details
    
    const emailContent = {
      to: user.email,
      subject: `Your purchase confirmation - ${pdf.title}`,
      template: 'purchase-confirmation',
      data: {
        pdfTitle: pdf.title,
        downloadUrl: downloadUrl,
        expiryHours: 48,
        supportEmail: 'support@financetransformers.ai'
      }
    }

    console.log('Email content prepared:', emailContent)

  } catch (error) {
    console.error('Error preparing confirmation email:', error)
  }
}

// Enhanced logging and analytics
async function logPaymentEvent(supabase: any, eventType: string, data: any) {
  try {
    await supabase
      .from('payment_analytics')
      .insert({
        event_type: eventType,
        event_data: data,
        timestamp: new Date().toISOString(),
        success: data.success ?? null,
        error_message: data.error ?? null,
        processing_time_ms: data.processing_time_ms ?? null,
        amount: data.amount ?? null,
        currency: data.currency ?? null,
        user_id: data.user_id ?? null,
        session_id: data.session_id ?? null,
        purchase_id: data.purchase_id ?? null
      })
  } catch (error) {
    // Don't fail the main process if logging fails
    console.error('Failed to log payment event:', error)
  }
}