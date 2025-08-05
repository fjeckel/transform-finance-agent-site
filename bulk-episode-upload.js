#!/usr/bin/env node

/**
 * Bulk Episode Content Upload Script
 * 
 * This script processes unstructured data (Word docs, text files, transcripts)
 * and uploads them to the episode database via Supabase APIs.
 * 
 * Usage:
 * 1. Paste your content when prompted
 * 2. Script will parse and structure the data
 * 3. Content gets uploaded to the database
 * 4. Automatic AI translation to supported languages (optional)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import readline from 'readline'

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Content parsing patterns
const CONTENT_PATTERNS = {
  // Episode title patterns
  title: [
    /^#\s+(.+)$/m,                    // Markdown header
    /^Title:\s*(.+)$/mi,              // "Title: ..."
    /^Episode\s*\d*:?\s*(.+)$/mi,     // "Episode 1: ..."
    /^(.+)\s*-\s*Episode/mi,          // "Title - Episode"
  ],
  
  // Summary patterns
  summary: [
    /Summary:\s*(.+?)(?=\n\n|\n[A-Z]|$)/mis,
    /Overview:\s*(.+?)(?=\n\n|\n[A-Z]|$)/mis,
    /Key Points:\s*(.+?)(?=\n\n|\n[A-Z]|$)/mis,
    /^(.{100,500}?)\.\s*(?:\n\n|\n[A-Z])/mis,  // First substantial paragraph
  ],
  
  // Description patterns
  description: [
    /Description:\s*(.+?)(?=\n\n|\n[A-Z]|$)/mis,
    /About this episode:\s*(.+?)(?=\n\n|\n[A-Z]|$)/mis,
    /In this episode:\s*(.+?)(?=\n\n|\n[A-Z]|$)/mis,
  ],
  
  // Main content patterns
  content: [
    /Content:\s*(.+)$/mis,
    /Transcript:\s*(.+)$/mis,
    /Full Text:\s*(.+)$/mis,
    /^(.{500,})$/mis,  // Everything if substantial
  ]
}

// Content processing utilities
class ContentProcessor {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
  }

  // Parse unstructured content into episode fields
  parseContent(rawContent) {
    const episode = {
      title: null,
      description: null,
      summary: null,
      content: null,
      metadata: {}
    }

    // Clean up the content
    const cleaned = rawContent
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    // Extract each field using patterns
    for (const [field, patterns] of Object.entries(CONTENT_PATTERNS)) {
      for (const pattern of patterns) {
        const match = cleaned.match(pattern)
        if (match && match[1] && !episode[field]) {
          episode[field] = match[1].trim()
          break
        }
      }
    }

    // Post-processing and validation
    this.postProcessEpisode(episode, cleaned)
    
    return episode
  }

  postProcessEpisode(episode, originalContent) {
    // If no title found, generate from first line
    if (!episode.title) {
      const firstLine = originalContent.split('\n')[0].trim()
      episode.title = firstLine.length > 5 && firstLine.length < 100 
        ? firstLine 
        : 'Untitled Episode'
    }

    // Generate summary if not found
    if (!episode.summary && episode.content) {
      const sentences = episode.content.split(/[.!?]+/).filter(s => s.trim().length > 20)
      episode.summary = sentences.slice(0, 3).join('. ').trim() + '.'
    }

    // Use content for description if not found
    if (!episode.description && episode.content) {
      const words = episode.content.split(' ')
      episode.description = words.length > 50 
        ? words.slice(0, 50).join(' ') + '...'
        : episode.content
    }

    // If content is empty, use the entire original
    if (!episode.content || episode.content.length < 100) {
      episode.content = originalContent
    }

    // Extract metadata
    this.extractMetadata(episode, originalContent)
  }

  extractMetadata(episode, content) {
    // Extract dates, authors, categories, etc.
    const dateMatch = content.match(/(?:Date|Published|Created):\s*([^\n]+)/i)
    if (dateMatch) episode.metadata.date = dateMatch[1].trim()

    const authorMatch = content.match(/(?:Author|Host|Speaker):\s*([^\n]+)/i)
    if (authorMatch) episode.metadata.author = authorMatch[1].trim()

    const categoryMatch = content.match(/(?:Category|Topic|Subject):\s*([^\n]+)/i)
    if (categoryMatch) episode.metadata.category = categoryMatch[1].trim()

    // Extract duration for audio content
    const durationMatch = content.match(/(?:Duration|Length|Runtime):\s*([^\n]+)/i)
    if (durationMatch) episode.metadata.duration = durationMatch[1].trim()

    // Word count
    episode.metadata.wordCount = content.split(/\s+/).length
  }

  // Interactive content input
  async promptForContent() {
    console.log('\n🎙️  Episode Content Upload Tool')
    console.log('=====================================\n')
    console.log('Paste your episode content below (Word doc text, transcript, etc.)')
    console.log('Press Ctrl+D (Unix) or Ctrl+Z (Windows) when finished:\n')

    return new Promise((resolve) => {
      let content = ''
      
      this.rl.on('line', (line) => {
        content += line + '\n'
      })
      
      this.rl.on('close', () => {
        resolve(content.trim())
      })
    })
  }

  // Preview parsed content
  displayPreview(episode) {
    console.log('\n📋 Parsed Episode Content Preview:')
    console.log('=====================================\n')
    
    console.log(`Title: ${episode.title}`)
    console.log(`\nDescription: ${episode.description?.substring(0, 150)}${episode.description?.length > 150 ? '...' : ''}`)
    console.log(`\nSummary: ${episode.summary?.substring(0, 200)}${episode.summary?.length > 200 ? '...' : ''}`)
    console.log(`\nContent: ${episode.content?.substring(0, 300)}${episode.content?.length > 300 ? '...' : ''}`)
    
    if (Object.keys(episode.metadata).length > 0) {
      console.log('\nMetadata:')
      Object.entries(episode.metadata).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`)
      })
    }
  }

  async confirmUpload() {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })
      
      rl.question('\n✅ Upload this episode? (y/n): ', (answer) => {
        rl.close()
        resolve(answer.toLowerCase().startsWith('y'))
      })
    })
  }

  close() {
    this.rl.close()
  }
}

// Database operations
class EpisodeUploader {
  constructor(supabaseClient) {
    this.supabase = supabaseClient
  }

  async uploadEpisode(episodeData) {
    try {
      console.log('\n📤 Uploading episode to database...')

      // Prepare episode record
      const episodeRecord = {
        title: episodeData.title,
        description: episodeData.description,
        content: episodeData.content,
        summary: episodeData.summary,
        status: 'draft', // Episodes start as drafts
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Insert episode
      const { data: episode, error: episodeError } = await this.supabase
        .from('episodes')
        .insert(episodeRecord)
        .select()
        .single()

      if (episodeError) {
        throw new Error(`Failed to create episode: ${episodeError.message}`)
      }

      console.log(`✅ Episode created successfully! ID: ${episode.id}`)
      return episode

    } catch (error) {
      console.error('❌ Upload failed:', error.message)
      throw error
    }
  }

  async translateEpisode(episodeId, targetLanguages = ['en']) {
    console.log('\n🌐 Starting AI translations...')
    
    const translations = []
    const fieldsToTranslate = ['title', 'description', 'content', 'summary']

    for (const language of targetLanguages) {
      try {
        console.log(`  Translating to ${language}...`)
        
        const { data, error } = await this.supabase.functions.invoke('translate-content-claude', {
          body: {
            contentId: episodeId,
            contentType: 'episode',
            targetLanguage: language,
            fields: fieldsToTranslate,
            priority: 'medium'
          }
        })

        if (error) {
          console.warn(`  ⚠️  Translation to ${language} failed: ${error.message}`)
        } else {
          console.log(`  ✅ ${language} translation completed`)
          translations.push({ language, data })
        }

      } catch (error) {
        console.warn(`  ⚠️  Translation to ${language} failed: ${error.message}`)
      }
    }

    return translations
  }
}

// Main execution
async function main() {
  try {
    const processor = new ContentProcessor()
    const uploader = new EpisodeUploader(supabase)

    // Get content from user
    const rawContent = await processor.promptForContent()
    
    if (!rawContent.trim()) {
      console.log('❌ No content provided. Exiting.')
      process.exit(1)
    }

    // Parse the content
    console.log('\n🔄 Processing content...')
    const episodeData = processor.parseContent(rawContent)

    // Show preview
    processor.displayPreview(episodeData)

    // Confirm upload
    const shouldUpload = await processor.confirmUpload()
    
    if (!shouldUpload) {
      console.log('❌ Upload cancelled.')
      processor.close()
      process.exit(0)
    }

    // Upload to database
    const episode = await uploader.uploadEpisode(episodeData)

    // Ask about translations
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const shouldTranslate = await new Promise((resolve) => {
      rl.question('\n🌐 Auto-translate to English? (y/n): ', (answer) => {
        rl.close()
        resolve(answer.toLowerCase().startsWith('y'))
      })
    })

    if (shouldTranslate) {
      await uploader.translateEpisode(episode.id, ['en'])
    }

    console.log('\n🎉 Episode upload completed successfully!')
    console.log(`   Episode ID: ${episode.id}`)
    console.log(`   Title: ${episode.title}`)
    console.log(`   Status: ${episode.status}`)

    processor.close()

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { ContentProcessor, EpisodeUploader }