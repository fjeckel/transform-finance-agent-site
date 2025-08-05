// Simple test to verify translation function works
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://aumijfxmeclxweojrefa.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWlqZnhtZWNseHdlb2pyZWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzgwMDksImV4cCI6MjA2Njk1NDAwOX0.71K0TyaDwxCrzanRfM_ciVXGc0jm9-qN_yfckiRmayc"

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testTranslation() {
  try {
    console.log('🧪 Testing translation function...')
    
    // Test if function exists
    const { data, error } = await supabase.functions.invoke('translate-content', {
      body: {
        contentId: 'test-id',
        contentType: 'episode',
        targetLanguage: 'en',
        fields: ['title'],
        priority: 'low'
      }
    })

    if (error) {
      console.error('❌ Translation function error:', error)
    } else {
      console.log('✅ Translation function responded:', data)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testTranslation()