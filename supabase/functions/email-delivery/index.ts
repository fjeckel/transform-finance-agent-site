import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailData {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: string
    type: string
    disposition: string
  }>
}

// Email templates
const generatePurchaseConfirmationEmail = (data: {
  pdfTitle: string
  customerEmail: string
  orderId: string
  amount: number
  currency: string
  downloadUrl?: string
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your PDF Purchase Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #13B87B; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .download-btn { 
          display: inline-block; 
          background: #13B87B; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0; 
        }
        .order-details { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Thank You for Your Purchase!</h1>
        </div>
        
        <div class="content">
          <h2>Your PDF is Ready</h2>
          <p>Hi there!</p>
          
          <p>Thank you for purchasing <strong>${data.pdfTitle}</strong>. Your PDF is attached to this email and ready for download.</p>
          
          <div class="order-details">
            <h3>📋 Order Details</h3>
            <p><strong>PDF:</strong> ${data.pdfTitle}</p>
            <p><strong>Amount:</strong> ${data.amount.toFixed(2)} ${data.currency.toUpperCase()}</p>
            <p><strong>Order ID:</strong> ${data.orderId}</p>
            <p><strong>Email:</strong> ${data.customerEmail}</p>
          </div>

          ${data.downloadUrl ? `
            <div style="text-align: center;">
              <a href="${data.downloadUrl}" class="download-btn">
                📥 Download Your PDF
              </a>
            </div>
            <p><em>Download link expires in 48 hours for security.</em></p>
          ` : `
            <p>📎 <strong>Your PDF is attached to this email.</strong></p>
          `}

          <h3>💡 What's Next?</h3>
          <ul>
            <li>Save this email for your records</li>
            <li>Download and save your PDF to your device</li>
            <li>Need help? Just reply to this email</li>
          </ul>

          <p>We hope you find the content valuable! If you have any questions, don't hesitate to reach out.</p>
        </div>
        
        <div class="footer">
          <p>This email was sent regarding your purchase from Finance Transformers.</p>
          <p>If you didn't make this purchase, please contact us immediately.</p>
          <p>© ${new Date().getFullYear()} Finance Transformers. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Simple email sending function (can be replaced with SendGrid/Mailgun)
async function sendEmail(emailData: EmailData): Promise<boolean> {
  // For now, we'll use a simple SMTP service
  // In production, replace with SendGrid or Mailgun
  
  try {
    // This is a placeholder - replace with actual email service
    console.log('Sending email to:', emailData.to)
    console.log('Subject:', emailData.subject)
    console.log('HTML content length:', emailData.html.length)
    console.log('Attachments:', emailData.attachments?.length || 0)
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return true
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      customerEmail, 
      pdfTitle, 
      orderId, 
      amount, 
      currency, 
      pdfContent, 
      downloadUrl 
    } = await req.json()

    if (!customerEmail || !pdfTitle || !orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate email content
    const emailHtml = generatePurchaseConfirmationEmail({
      pdfTitle,
      customerEmail,
      orderId,
      amount: amount || 0,
      currency: currency || 'EUR',
      downloadUrl
    })

    // Prepare email data
    const emailData: EmailData = {
      to: customerEmail,
      subject: `Your ${pdfTitle} is Ready for Download`,
      html: emailHtml
    }

    // Add PDF attachment if content is provided
    if (pdfContent) {
      emailData.attachments = [{
        filename: `${pdfTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        content: pdfContent, // Base64 encoded PDF
        type: 'application/pdf',
        disposition: 'attachment'
      }]
    }

    // Send email
    const success = await sendEmail(emailData)

    if (success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      throw new Error('Email delivery failed')
    }

  } catch (error) {
    console.error('Email delivery error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})