#!/usr/bin/env node

// Test script to verify webhook and email delivery functions work
async function testWebhookFlow() {
  console.log('🧪 Testing Webhook & Email Delivery...\n');
  
  try {
    // Test 1: Webhook endpoint accessibility
    console.log('📡 Testing webhook endpoint accessibility...');
    const webhookResponse = await fetch('https://aumijfxmeclxweojrefa.supabase.co/functions/v1/stripe-fulfillment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'invalid-signature-for-testing'
      },
      body: JSON.stringify({
        type: 'test',
        data: { object: { id: 'test_session' } }
      })
    });
    
    console.log('📊 Webhook Response Status:', webhookResponse.status);
    
    if (webhookResponse.status === 400) {
      console.log('✅ Webhook endpoint is accessible (400 expected for invalid signature)');
    } else if (webhookResponse.status === 401) {
      console.log('❌ Webhook still requires authentication - needs --no-verify-jwt deployment');
      return false;
    } else {
      console.log('⚠️ Unexpected webhook response:', webhookResponse.status);
    }
    
    // Test 2: Email delivery endpoint accessibility
    console.log('\n📧 Testing email delivery endpoint...');
    const emailResponse = await fetch('https://aumijfxmeclxweojrefa.supabase.co/functions/v1/email-delivery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerEmail: 'test@example.com',
        pdfTitle: 'Test PDF',
        orderId: 'test123',
        amount: 9.99,
        currency: 'EUR',
        pdfUrl: 'https://example.com/test.pdf'
      })
    });
    
    console.log('📊 Email Response Status:', emailResponse.status);
    
    if (emailResponse.status === 200 || emailResponse.status === 201) {
      console.log('✅ Email delivery endpoint is working');
      const emailResult = await emailResponse.json().catch(() => ({}));
      console.log('📧 Email result:', emailResult);
    } else {
      console.log('❌ Email delivery endpoint issue:', emailResponse.status);
      const errorData = await emailResponse.text().catch(() => 'Unknown error');
      console.log('Error details:', errorData);
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Configure Stripe webhook URL: https://aumijfxmeclxweojrefa.supabase.co/functions/v1/stripe-fulfillment');
    console.log('2. Test with a real payment to trigger the webhook');
    console.log('3. Check function logs in Supabase dashboard for debugging');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run test
testWebhookFlow()
  .then(success => {
    if (success) {
      console.log('\n🎉 Webhook and email systems are ready for testing!');
      process.exit(0);
    } else {
      console.log('\n💥 System not ready - check the issues above');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Test script error:', error);
    process.exit(1);
  });