import { supabase } from '@/integrations/supabase/client'
import { sanitizeContent, markdownToSafeHtml } from './content-security'

export interface ContentMigration {
  id: string
  oldContent: string
  newContent: string
  format: 'markdown' | 'html' | 'plain'
  tableName: 'insights' | 'episodes'
}

export interface MigrationProgress {
  total: number
  processed: number
  successful: number
  failed: number
  errors: Array<{ id: string; error: string }>
}

/**
 * Converts plain text to HTML with basic formatting
 */
export const plainTextToHtml = (text: string): string => {
  if (!text) return ''
  
  // Convert line breaks to HTML
  const htmlContent = text
    .replace(/\n\n/g, '</p><p>') // Double line breaks = new paragraphs
    .replace(/\n/g, '<br>') // Single line breaks = line breaks
  
  // Wrap in paragraph tags
  return `<p>${htmlContent}</p>`
}

/**
 * Converts markdown to safe HTML
 */
export const migrateMarkdownToHtml = async (markdown: string): Promise<string> => {
  try {
    return await markdownToSafeHtml(markdown)
  } catch (error) {
    console.error('Error converting markdown to HTML:', error)
    // Fallback: treat as plain text
    return sanitizeContent(plainTextToHtml(markdown))
  }
}

/**
 * Migrates content from one format to another
 */
export const migrateContent = async (
  content: string,
  fromFormat: 'markdown' | 'plain' | 'html',
  toFormat: 'html'
): Promise<string> => {
  if (!content) return ''
  
  switch (fromFormat) {
    case 'markdown':
      return await migrateMarkdownToHtml(content)
    
    case 'plain':
      return sanitizeContent(plainTextToHtml(content))
    
    case 'html':
      return sanitizeContent(content)
    
    default:
      throw new Error(`Unsupported migration from ${fromFormat} to ${toFormat}`)
  }
}

/**
 * Batch migrate insights from markdown to HTML
 */
export const migrateInsightsToHtml = async (
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationProgress> => {
  const progress: MigrationProgress = {
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: []
  }

  try {
    // Get all insights with markdown content
    const { data: insights, error: fetchError } = await supabase
      .from('insights')
      .select('id, content, content_format')
      .or('content_format.eq.markdown,content_format.is.null')
    
    if (fetchError) throw fetchError
    
    progress.total = insights?.length || 0
    onProgress?.(progress)

    if (!insights || insights.length === 0) {
      return progress
    }

    // Process in batches of 5 to avoid overwhelming the database
    const batchSize = 5
    for (let i = 0; i < insights.length; i += batchSize) {
      const batch = insights.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async (insight) => {
          try {
            const migratedContent = await migrateContent(
              insight.content || '',
              'markdown',
              'html'
            )

            const { error: updateError } = await supabase
              .from('insights')
              .update({
                content: migratedContent,
                content_format: 'html',
                updated_at: new Date().toISOString()
              })
              .eq('id', insight.id)

            if (updateError) throw updateError

            progress.successful++
          } catch (error) {
            progress.failed++
            progress.errors.push({
              id: insight.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
          
          progress.processed++
          onProgress?.(progress)
        })
      )
    }

    return progress
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

/**
 * Batch migrate episodes from plain text to HTML
 */
export const migrateEpisodesToHtml = async (
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationProgress> => {
  const progress: MigrationProgress = {
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: []
  }

  try {
    // Get all episodes with plain content
    const { data: episodes, error: fetchError } = await supabase
      .from('episodes')
      .select('id, content, content_format')
      .or('content_format.eq.plain,content_format.is.null')
    
    if (fetchError) throw fetchError
    
    progress.total = episodes?.length || 0
    onProgress?.(progress)

    if (!episodes || episodes.length === 0) {
      return progress
    }

    // Process in batches
    const batchSize = 5
    for (let i = 0; i < episodes.length; i += batchSize) {
      const batch = episodes.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async (episode) => {
          try {
            const migratedContent = await migrateContent(
              episode.content || '',
              'plain',
              'html'
            )

            const { error: updateError } = await supabase
              .from('episodes')
              .update({
                content: migratedContent,
                content_format: 'html',
                updated_at: new Date().toISOString()
              })
              .eq('id', episode.id)

            if (updateError) throw updateError

            progress.successful++
          } catch (error) {
            progress.failed++
            progress.errors.push({
              id: episode.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
          
          progress.processed++
          onProgress?.(progress)
        })
      )
    }

    return progress
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

/**
 * Rollback content migration (convert HTML back to original format)
 */
export const rollbackMigration = async (
  tableName: 'insights' | 'episodes',
  targetFormat: 'markdown' | 'plain'
): Promise<MigrationProgress> => {
  const progress: MigrationProgress = {
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: []
  }

  try {
    // Get all records with HTML content
    const { data: records, error: fetchError } = await supabase
      .from(tableName)
      .select('id, content, content_format')
      .eq('content_format', 'html')
    
    if (fetchError) throw fetchError
    
    progress.total = records?.length || 0

    if (!records || records.length === 0) {
      return progress
    }

    // For rollback, we'll just change the format flag back
    // Note: This is a simplified rollback - full HTML-to-markdown conversion
    // would require additional libraries like turndown
    for (const record of records) {
      try {
        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            content_format: targetFormat,
            updated_at: new Date().toISOString()
          })
          .eq('id', record.id)

        if (updateError) throw updateError

        progress.successful++
      } catch (error) {
        progress.failed++
        progress.errors.push({
          id: record.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
      
      progress.processed++
    }

    return progress
  } catch (error) {
    console.error('Rollback failed:', error)
    throw error
  }
}

/**
 * Get migration status for a table
 */
export const getMigrationStatus = async (tableName: 'insights' | 'episodes') => {
  const { data, error } = await supabase
    .from(tableName)
    .select('content_format')
  
  if (error) throw error
  
  const counts = data?.reduce((acc, record) => {
    const format = record.content_format || (tableName === 'insights' ? 'markdown' : 'plain')
    acc[format] = (acc[format] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}
  
  return {
    total: data?.length || 0,
    formats: counts,
    needsMigration: (counts.markdown || 0) + (counts.plain || 0) > 0
  }
}