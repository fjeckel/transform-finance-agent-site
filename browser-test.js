// Run this in browser console on https://www.financetransformers.ai/discover

// Check if supabase is available
if (window.supabase) {
  console.log('✅ Supabase client found');
} else {
  console.log('❌ Supabase client not found');
}

// Test direct database query
const testDatabase = async () => {
  const response = await fetch('https://aumijfxmeclxweojrefa.supabase.co/rest/v1/youtube_videos?select=*&limit=5', {
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWlqZnhtZWNseHdlb2pyZWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzgwMDksImV4cCI6MjA2Njk1NDAwOX0.71K0TyaDwxCrzanRfM_ciVXGc0jm9-qN_yfckiRmayc',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWlqZnhtZWNseHdlb2pyZWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzgwMDksImV4cCI6MjA2Njk1NDAwOX0.71K0TyaDwxCrzanRfM_ciVXGc0jm9-qN_yfckiRmayc'
    }
  });
  const data = await response.json();
  console.log('📊 Database videos:', data);
  return data;
};

// Check what's in the DOM
const checkDOM = () => {
  const youtubeSection = document.querySelector('[class*="youtube"]');
  if (youtubeSection) {
    console.log('✅ YouTube section found in DOM:', youtubeSection);
  } else {
    console.log('❌ No YouTube section in DOM');
  }
  
  const discoverPage = document.querySelector('main');
  if (discoverPage) {
    console.log('📄 Discover page content:', discoverPage.innerHTML.substring(0, 500));
  }
};

// Check React components
const checkReact = () => {
  const reactRoot = document.getElementById('root');
  if (reactRoot && reactRoot._reactRootContainer) {
    console.log('✅ React app is mounted');
  } else {
    console.log('⚠️ React app mount status unclear');
  }
};

// Run all checks
console.log('🔍 Starting YouTube integration diagnostics...\n');
checkDOM();
checkReact();
testDatabase().then(videos => {
  console.log(`\n✅ Found ${videos.length} videos in database`);
  if (videos.length > 0) {
    console.log('First video:', videos[0].title);
  }
});

// Check environment variables
console.log('\n🔑 Checking environment...');
console.log('Page URL:', window.location.href);
console.log('Has YouTube in page?', document.body.innerHTML.includes('YouTube'));