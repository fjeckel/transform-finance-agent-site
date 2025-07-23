import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  // Handle CORS preflight requests
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
      return new Response('Missing stripe-signature header', { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    console.log('Received webhook event:', event.type)

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSuccess(supabase, paymentIntent)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailed(supabase, paymentIntent)
        break
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        await handleDispute(supabase, dispute)
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
    return new Response('Webhook handler error', { status: 500 })
  }
})

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