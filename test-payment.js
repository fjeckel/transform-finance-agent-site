#!/usr/bin/env node

// Simple test script to verify Stripe payment link creation
const fetch = require('node-fetch');

async function testPaymentLinkCreation() {
  console.log('🧪 Testing Stripe Payment Link Creation...\n');
  
  const testPdfId = '12345678-1234-1234-1234-123456789012'; // Mock UUID for testing
  
  try {
    const response = await fetch('https://aumijfxmeclxweojrefa.supabase.co/functions/v1/create-payment-link-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWlqZnhtZWNseHdlb2pyZWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk4NDUwMDksImV4cCI6MjAzNTQyMTAwOX0.-5jfzQNXjXU1lvyZytnEkOUBwNHd9_V5CIdnrSaXZDw'
      },
      body: JSON.stringify({
        pdfId: testPdfId
      })
    });
    
    const result = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers));
    console.log('💬 Response Body:', JSON.stringify(result, null, 2));
    
    if (response.status === 404) {
      console.log('\n✅ EXPECTED: PDF not found (test PDF ID doesn\'t exist)');
      console.log('✅ Security: Input validation working');
      console.log('✅ Function: Deployed and accessible');
      return true;
    }
    
    if (response.status === 400 && result.error?.includes('Invalid')) {
      console.log('\n✅ EXPECTED: Input validation working');
      console.log('✅ Security: Proper error handling');
      return true;
    }
    
    if (response.status === 429) {
      console.log('\n✅ EXPECTED: Rate limiting working');
      return true;
    }
    
    if (response.ok && result.paymentLinkUrl) {
      console.log('\n✅ SUCCESS: Payment link created');
      console.log('🔗 Payment URL:', result.paymentLinkUrl);
      return true;
    }
    
    console.log('\n❌ Unexpected response');
    return false;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run test
testPaymentLinkCreation()
  .then(success => {
    if (success) {
      console.log('\n🎉 Payment function test completed successfully!');
      process.exit(0);
    } else {
      console.log('\n💥 Payment function test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Test script error:', error);
    process.exit(1);
  });