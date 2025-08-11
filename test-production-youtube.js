#!/usr/bin/env node

const SUPABASE_URL = 'https://aumijfxmeclxweojrefa.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWlqZnhtZWNseHdlb2pyZWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzgwMDksImV4cCI6MjA2Njk1NDAwOX0.71K0TyaDwxCrzanRfM_ciVXGc0jm9-qN_yfckiRmayc';

async function testEdgeFunction() {
  console.log('🔍 Testing Edge Function with POST method...\n');
  
  try {
    // Test with POST method (new way)
    const response = await fetch(`${SUPABASE_URL}/functions/v1/youtube-videos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'list',
        limit: 5,
        shorts_only: true
      })
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('\n✅ Edge Function Response:');
    console.log('Videos found:', data.videos?.length || 0);
    if (data.videos?.length > 0) {
      console.log('Sample video:', data.videos[0].title);
    }
    console.log('\nFull response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Edge Function Error:', error);
  }
}

async function testDirectDatabase() {
  console.log('\n\n🔍 Testing Direct Database Query...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/youtube_videos?select=*&is_short=eq.true&limit=5`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      }
    });

    console.log('Response Status:', response.status);
    
    const data = await response.json();
    console.log('\n✅ Database Response:');
    console.log('Videos found:', data.length);
    if (data.length > 0) {
      console.log('Sample video:', data[0].title);
    }
  } catch (error) {
    console.error('❌ Database Error:', error);
  }
}

async function testFromBrowser() {
  console.log('\n\n📱 Browser Test Code:\n');
  console.log('Copy and paste this into browser console on https://www.financetransformers.ai/discover:\n');
  
  const browserCode = `
// Test edge function from browser
fetch('https://aumijfxmeclxweojrefa.supabase.co/functions/v1/youtube-videos', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${ANON_KEY}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'list',
    limit: 5,
    shorts_only: true
  })
})
.then(r => r.json())
.then(data => {
  console.log('Edge function response:', data);
  console.log('Videos found:', data.videos?.length || 0);
})
.catch(err => console.error('Error:', err));
`;
  
  console.log(browserCode);
}

// Run all tests
(async () => {
  await testEdgeFunction();
  await testDirectDatabase();
  await testFromBrowser();
})();