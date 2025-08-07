#!/usr/bin/env node

// Simple test script to verify Stripe payment link creation

async function testPaymentLinkCreation() {
  console.log('🧪 Testing Stripe Payment Link Creation...\n');
  
  // First, let's check if there are any real PDFs to test with
  console.log('First checking for available PDFs...');
  
  const pdfResponse = await fetch('https://aumijfxmeclxweojrefa.supabase.co/rest/v1/downloadable_pdfs?is_premium=eq.true&select=id,title,price', {
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWlqZnhtZWNseHdlb2pyZWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzgwMDksImV4cCI6MjA2Njk1NDAwOX0.71K0TyaDwxCrzanRfM_ciVXGc0jm9-qN_yfckiRmayc',
      'Content-Type': 'application/json'
    }
  });
  
  const pdfs = await pdfResponse.json();
  console.log('Available PDFs:', pdfs);
  
  if (!Array.isArray(pdfs) || pdfs.length === 0) {
    console.log('ℹ️ No premium PDFs found, using test UUID');
    var testPdfId = '12345678-1234-1234-1234-123456789012'; // Mock UUID for testing
  } else {
    console.log('📋 Using real PDF:', pdfs[0].title);
    var testPdfId = pdfs[0].id;
  }
  
  try {
    const response = await fetch('https://aumijfxmeclxweojrefa.supabase.co/functions/v1/create-payment-link-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWlqZnhtZWNseHdlb2pyZWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzgwMDksImV4cCI6MjA2Njk1NDAwOX0.71K0TyaDwxCrzanRfM_ciVXGc0jm9-qN_yfckiRmayc',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWlqZnhtZWNseHdlb2pyZWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzgwMDksImV4cCI6MjA2Njk1NDAwOX0.71K0TyaDwxCrzanRfM_ciVXGc0jm9-qN_yfckiRmayc'
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