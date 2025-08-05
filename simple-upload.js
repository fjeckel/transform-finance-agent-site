// Simple Episode Upload Script
const { createClient } = require('@supabase/supabase-js')
const readline = require('readline')

// Your Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

console.log('🔗 Connecting to Supabase...')
console.log('URL:', SUPABASE_URL ? 'Set ✅' : 'Missing ❌')
console.log('Key:', SUPABASE_ANON_KEY ? 'Set ✅' : 'Missing ❌')

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log('\n❌ Please set your environment variables first:')
  console.log('export SUPABASE_URL="https://aumijfxmeclxweojrefa.supabase.co"')
  console.log('export SUPABASE_ANON_KEY="your-key-here"')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Simple content parser
function parseContent(rawContent) {
  const lines = rawContent.split('\n').filter(line => line.trim())
  
  let title = 'Untitled Episode'
  let description = ''
  let summary = ''
  let content = rawContent
  
  // Try to find title
  for (let line of lines) {
    if (line.includes('Title:')) {
      title = line.replace('Title:', '').trim()
      break
    }
    if (line.includes('Episode') && line.length < 100) {
      title = line.trim()
      break
    }
    if (lines.indexOf(line) === 0 && line.length > 10 && line.length < 100) {
      title = line.trim()
      break
    }
  }
  
  // Create description from first paragraph
  const paragraphs = rawContent.split('\n\n').filter(p => p.trim())
  if (paragraphs.length > 0) {
    description = paragraphs[0].replace(title, '').trim().substring(0, 500)
  }
  
  // Create summary from first few sentences
  const sentences = rawContent.split(/[.!?]+/).filter(s => s.trim().length > 20)
  if (sentences.length > 0) {
    summary = sentences.slice(0, 2).join('. ').trim() + '.'
  }
  
  return { title, description, summary, content }
}

// Main upload function
async function uploadEpisode() {
  console.log('\n🎙️  Episode Content Upload Tool')
  console.log('=====================================\n')
  console.log('Paste your episode content below, then press Enter twice when finished:\n')
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  let content = ''
  let emptyLines = 0
  
  console.log('Start pasting your content:')
  
  return new Promise((resolve) => {
    rl.on('line', (line) => {
      if (line.trim() === '') {
        emptyLines++
        if (emptyLines >= 2) {
          rl.close()
          return
        }
      } else {
        emptyLines = 0
      }
      content += line + '\n'
    })
    
    rl.on('close', async () => {
      if (!content.trim()) {
        console.log('❌ No content provided')
        process.exit(1)
      }
      
      try {
        console.log('\n🔄 Processing content...')
        const episode = parseContent(content.trim())
        
        console.log('\n📋 Preview:')
        console.log('=====================================')
        console.log(`Title: ${episode.title}`)
        console.log(`Description: ${episode.description.substring(0, 100)}...`)
        console.log(`Summary: ${episode.summary.substring(0, 100)}...`)
        console.log(`Content: ${episode.content.substring(0, 100)}...`)
        console.log(`Word count: ${episode.content.split(' ').length}`)
        
        // Confirm upload
        const confirmRl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        })
        
        confirmRl.question('\n✅ Upload this episode? (y/n): ', async (answer) => {
          confirmRl.close()
          
          if (!answer.toLowerCase().startsWith('y')) {
            console.log('❌ Upload cancelled')
            process.exit(0)
          }
          
          console.log('\n📤 Uploading to database...')
          
          const { data, error } = await supabase
            .from('episodes')
            .insert({
              title: episode.title,
              description: episode.description,
              content: episode.content,
              summary: episode.summary,
              status: 'draft'
            })
            .select()
            .single()
          
          if (error) {
            console.error('❌ Upload failed:', error.message)
            process.exit(1)
          }
          
          console.log('\n🎉 Success! Episode uploaded!')
          console.log(`Episode ID: ${data.id}`)
          console.log(`Title: ${data.title}`)
          console.log(`Status: ${data.status}`)
          
          resolve(data)
        })
        
      } catch (error) {
        console.error('❌ Error:', error.message)
        process.exit(1)
      }
    })
  })
}

// Run the upload
uploadEpisode().catch(console.error)