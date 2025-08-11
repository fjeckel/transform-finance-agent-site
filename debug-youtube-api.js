// Debug script to test YouTube API integration
// Run this in browser console on /discover page

async function debugYouTubeAPI() {
  console.log('🔍 Starting YouTube API Debug...');
  
  // Test direct edge function call
  try {
    console.log('1. Testing direct edge function call...');
    
    const response = await fetch('/functions/v1/youtube-videos?action=list&limit=6&shorts_only=true', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${window.supabase?.supabaseKey}`,
        'apikey': window.supabase?.supabaseKey || ''
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.text();
    console.log('Raw response:', data);
    
    try {
      const jsonData = JSON.parse(data);
      console.log('Parsed response:', jsonData);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
    }
    
  } catch (error) {
    console.error('Direct API call failed:', error);
  }
  
  // Test database direct query
  try {
    console.log('\n2. Testing direct database query...');
    if (window.supabase) {
      const { data, error } = await window.supabase
        .from('youtube_videos')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(6);
        
      console.log('Database query result:', { data, error });
    } else {
      console.log('Supabase client not available');
    }
  } catch (error) {
    console.error('Database query failed:', error);
  }
  
  // Test hook execution
  console.log('\n3. Check hook execution in React DevTools Components tab');
  console.log('Look for useYouTubeVideos hook state');
}

// Auto-run if on discover page
if (window.location.pathname === '/discover') {
  debugYouTubeAPI();
} else {
  console.log('Navigate to /discover page first, then run debugYouTubeAPI()');
}