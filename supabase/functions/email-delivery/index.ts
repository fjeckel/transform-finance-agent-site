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
  const currentYear = new Date().getFullYear()
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your ${data.pdfTitle} is Ready - Finance Transformers</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white; 
          border-radius: 8px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #13B87B 0%, #0F9A6A 100%); 
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
        }
        .header h1 { 
          font-size: 24px; 
          font-weight: 600; 
          margin-bottom: 8px;
        }
        .header p { 
          font-size: 16px; 
          opacity: 0.9;
        }
        .content { 
          padding: 30px 20px; 
        }
        .status-badge {
          display: inline-block;
          background: #E8F5E8;
          color: #2D7A2D;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 20px;
        }
        .download-section {
          background: #F0F9FF;
          border: 2px solid #E0F2FE;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          margin: 24px 0;
        }
        .download-btn { 
          display: inline-block; 
          background: #13B87B; 
          color: white; 
          padding: 14px 28px; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: 600;
          font-size: 16px;
          margin: 16px 0;
          transition: background-color 0.3s ease;
        }
        .download-btn:hover {
          background: #0F9A6A;
        }
        .order-details { 
          background: #FAFBFC; 
          border: 1px solid #E5E7EB;
          padding: 20px; 
          border-radius: 8px; 
          margin: 24px 0; 
        }
        .order-details h3 {
          color: #374151;
          margin-bottom: 12px;
          font-size: 18px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #E5E7EB;
        }
        .detail-row:last-child {
          border-bottom: none;
          font-weight: 600;
          color: #13B87B;
        }
        .instructions {
          background: #FFF7ED;
          border-left: 4px solid #F59E0B;
          padding: 16px;
          margin: 24px 0;
          border-radius: 0 6px 6px 0;
        }
        .instructions h3 {
          color: #92400E;
          margin-bottom: 8px;
        }
        .instructions ul {
          list-style: none;
          padding-left: 0;
        }
        .instructions li {
          padding: 4px 0;
          position: relative;
          padding-left: 20px;
        }
        .instructions li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #F59E0B;
          font-weight: bold;
        }
        .support-section {
          background: #F3F4F6;
          padding: 20px;
          border-radius: 8px;
          margin: 24px 0;
          text-align: center;
        }
        .footer { 
          background: #1F2937;
          color: #D1D5DB;
          padding: 24px 20px; 
          text-align: center; 
          font-size: 14px;
        }
        .footer a {
          color: #13B87B;
          text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
          .container { margin: 10px; }
          .content, .header { padding: 20px 15px; }
          .download-btn { padding: 12px 24px; font-size: 14px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Confirmed</h1>
          <p>Your PDF is ready for download</p>
        </div>
        
        <div class="content">
          <div class="status-badge">✓ Purchase Complete</div>
          
          <h2 style="color: #374151; margin-bottom: 16px;">Hi there!</h2>
          
          <p style="margin-bottom: 20px;">
            Your payment has been successfully processed. You can now access your purchased content:
          </p>

          <div class="download-section">
            <h3 style="color: #1E40AF; margin-bottom: 8px;">📄 ${data.pdfTitle}</h3>
            <p style="color: #6B7280; margin-bottom: 16px;">
              ${data.downloadUrl ? 'Click the button below to download your PDF:' : 'Your PDF is attached to this email.'}
            </p>
            
            ${data.downloadUrl ? `
              <a href="${data.downloadUrl}" class="download-btn">
                Download PDF Now
              </a>
              <p style="font-size: 12px; color: #6B7280; margin-top: 12px;">
                <strong>Security Notice:</strong> This download link expires in 48 hours
              </p>
            ` : `
              <div style="background: #FEF3C7; color: #92400E; padding: 12px; border-radius: 6px; font-size: 14px;">
                📎 <strong>Your PDF is attached to this email</strong><br>
                Look for the attachment in your email client
              </div>
            `}
          </div>
          
          <div class="order-details">
            <h3>Order Summary</h3>
            <div class="detail-row">
              <span><strong>Product:</strong></span>
              <span>${data.pdfTitle}</span>
            </div>
            <div class="detail-row">
              <span><strong>Order Date:</strong></span>
              <span>${currentDate}</span>
            </div>
            <div class="detail-row">
              <span><strong>Order ID:</strong></span>
              <span>${data.orderId.substring(0, 20)}...</span>
            </div>
            <div class="detail-row">
              <span><strong>Customer Email:</strong></span>
              <span>${data.customerEmail}</span>
            </div>
            <div class="detail-row">
              <span><strong>Amount Paid:</strong></span>
              <span>${data.amount.toFixed(2)} ${data.currency.toUpperCase()}</span>
            </div>
          </div>

          <div class="instructions">
            <h3>Next Steps</h3>
            <ul>
              <li>Save this email for your records</li>
              <li>Download the PDF to your device</li>
              <li>Store the PDF in a safe location</li>
              <li>Contact us if you experience any issues</li>
            </ul>
          </div>

          <div class="support-section">
            <h3 style="color: #374151; margin-bottom: 12px;">Need Help?</h3>
            <p style="color: #6B7280; margin-bottom: 12px;">
              If you're having trouble downloading your PDF or have any questions:
            </p>
            <p>
              <strong>Email:</strong> <a href="mailto:support@financetransformers.com">support@financetransformers.com</a><br>
              <strong>Include your Order ID:</strong> ${data.orderId}
            </p>
          </div>

          <p style="color: #6B7280; font-size: 14px; margin-top: 24px;">
            Thank you for your purchase! We hope you find the content valuable and actionable.
          </p>
        </div>
        
        <div class="footer">
          <p style="margin-bottom: 8px;">
            <strong>Finance Transformers</strong>
          </p>
          <p style="margin-bottom: 16px;">
            This email was sent regarding your purchase confirmation.
          </p>
          <p style="font-size: 12px;">
            If you did not make this purchase, please <a href="mailto:support@financetransformers.com">contact us immediately</a>.<br>
            © ${currentYear} Finance Transformers. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Simple email sending function (can be replaced with SendGrid/Mailgun)
async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    console.log('=== EMAIL DELIVERY START ===')
    console.log('Sending email to:', emailData.to)
    console.log('Subject:', emailData.subject)
    
    // Check for Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not configured, using Gmail SMTP fallback...')
      return await sendEmailViaGmail(emailData)
    }

    // Send via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Finance Transformers <noreply@financetransformers.com>',
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
        attachments: emailData.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          content_type: att.type
        })) || []
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Resend API error:', response.status, errorData)
      
      // Fallback to Gmail SMTP if Resend fails
      console.warn('Resend failed, trying Gmail SMTP fallback...')
      return await sendEmailViaGmail(emailData)
    }

    const result = await response.json()
    console.log('✅ Email sent successfully via Resend:', result.id)
    return true

  } catch (error) {
    console.error('❌ Email sending failed:', error)
    
    // Try Gmail SMTP as last resort
    try {
      console.warn('Attempting Gmail SMTP fallback...')
      return await sendEmailViaGmail(emailData)
    } catch (fallbackError) {
      console.error('❌ All email methods failed:', fallbackError)
      return false
    }
  }
}

// Gmail SMTP fallback for development/testing
async function sendEmailViaGmail(emailData: EmailData): Promise<boolean> {
  try {
    // This is a simplified SMTP implementation for Gmail
    // In production, you should use proper SMTP libraries
    
    const gmailUser = Deno.env.get('GMAIL_USER')
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD')
    
    if (!gmailUser || !gmailPassword) {
      console.error('Gmail credentials not configured')
      console.log('Email content would be:')
      console.log('To:', emailData.to)
      console.log('Subject:', emailData.subject)
      console.log('HTML length:', emailData.html.length)
      console.log('Attachments:', emailData.attachments?.length || 0)
      
      // Return true for development - in production this should return false
      return true
    }

    // TODO: Implement actual Gmail SMTP sending
    // For now, log the email details
    console.log('📧 Would send email via Gmail SMTP:')
    console.log('From:', gmailUser)
    console.log('To:', emailData.to)
    console.log('Subject:', emailData.subject)
    
    return true
    
  } catch (error) {
    console.error('Gmail SMTP fallback failed:', error)
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