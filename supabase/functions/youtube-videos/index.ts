import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const WTF_CHANNEL_ID = 'UC2sXuBElJDyzxKv3J8kmyng'

interface YouTubeVideo {
  kind: string
  etag: string
  id: {
    kind: string
    videoId: string
  }
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: {
      default: { url: string; width: number; height: number }
      medium: { url: string; width: number; height: number }
      high: { url: string; width: number; height: number }
      standard?: { url: string; width: number; height: number }
      maxres?: { url: string; width: number; height: number }
    }
    channelTitle: string
    categoryId: string
    tags?: string[]
  }
}

interface YouTubeVideoDetails {
  kind: string
  etag: string
  id: string
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: any
    channelTitle: string
    categoryId: string
    tags?: string[]
  }
  contentDetails: {
    duration: string
    dimension: string
    definition: string
  }
  statistics: {
    viewCount: string
    likeCount?: string
    dislikeCount?: string
    favoriteCount?: string
    commentCount?: string
  }
}

// Convert YouTube duration (PT4M13S) to readable format (4:13)
function parseDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return '0:00'
  
  const hours = parseInt(match[1]?.replace('H', '') || '0')
  const minutes = parseInt(match[2]?.replace('M', '') || '0')
  const seconds = parseInt(match[3]?.replace('S', '') || '0')
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Check if video is likely a Short (duration <= 60 seconds and vertical aspect ratio)
function isShort(duration: string, dimension: string): boolean {
  const totalSeconds = parseDurationToSeconds(duration)
  return totalSeconds <= 60 && dimension !== '2d' // Shorts are typically vertical
}

function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1]?.replace('H', '') || '0')
  const minutes = parseInt(match[2]?.replace('M', '') || '0')
  const seconds = parseInt(match[3]?.replace('S', '') || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}

// Format view count for display (1234 -> "1.2K")
function formatViewCount(count: string): string {
  const num = parseInt(count)
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('YouTube edge function called with URL:', req.url);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')
    if (!youtubeApiKey) {
      console.error('YouTube API key not found in environment variables');
      throw new Error('YouTube API key not found in environment variables')
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'fetch'
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const shortsOnly = url.searchParams.get('shorts_only') === 'true'

    console.log('Parsed parameters:', { action, limit, shortsOnly });

    if (action === 'fetch') {
      console.log('Fetching latest videos from YouTube API...')

      // Step 1: Search for latest videos from the channel
      const searchUrl = `${YOUTUBE_API_BASE}/search?` + new URLSearchParams({
        key: youtubeApiKey,
        channelId: WTF_CHANNEL_ID,
        part: 'snippet',
        order: 'date',
        maxResults: limit.toString(),
        type: 'video'
      })

      const searchResponse = await fetch(searchUrl)
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text()
        throw new Error(`YouTube Search API error: ${searchResponse.status} - ${errorText}`)
      }

      const searchData = await searchResponse.json()
      const videos = searchData.items as YouTubeVideo[]

      if (!videos || videos.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No videos found', count: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Step 2: Get detailed info for each video (duration, view count, etc.)
      const videoIds = videos.map(v => v.id.videoId).join(',')
      const detailsUrl = `${YOUTUBE_API_BASE}/videos?` + new URLSearchParams({
        key: youtubeApiKey,
        id: videoIds,
        part: 'snippet,contentDetails,statistics'
      })

      const detailsResponse = await fetch(detailsUrl)
      if (!detailsResponse.ok) {
        throw new Error(`YouTube Videos API error: ${detailsResponse.status}`)
      }

      const detailsData = await detailsResponse.json()
      const videoDetails = detailsData.items as YouTubeVideoDetails[]

      // Step 3: Process and store videos
      const processedVideos = videoDetails.map(video => {
        const duration = parseDuration(video.contentDetails.duration)
        const viewCount = parseInt(video.statistics.viewCount || '0')
        const likeCount = parseInt(video.statistics.likeCount || '0')
        
        return {
          video_id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail_url: video.snippet.thumbnails.maxres?.url || 
                        video.snippet.thumbnails.high?.url ||
                        video.snippet.thumbnails.medium?.url ||
                        video.snippet.thumbnails.default?.url,
          duration,
          view_count: viewCount,
          like_count: likeCount,
          published_at: video.snippet.publishedAt,
          channel_id: video.snippet.channelId,
          is_short: isShort(video.contentDetails.duration, video.contentDetails.dimension),
          tags: video.snippet.tags || [],
          category_id: video.snippet.categoryId
        }
      })

      // Step 4: Upsert videos to database
      const { data: upsertData, error: upsertError } = await supabaseClient
        .from('youtube_videos')
        .upsert(processedVideos, { 
          onConflict: 'video_id',
          ignoreDuplicates: false 
        })
        .select()

      if (upsertError) {
        console.error('Database upsert error:', upsertError)
        throw new Error(`Database error: ${upsertError.message}`)
      }

      console.log(`Successfully processed ${processedVideos.length} videos`)

      return new Response(
        JSON.stringify({ 
          message: 'Videos updated successfully',
          count: processedVideos.length,
          videos: processedVideos.map(v => ({
            video_id: v.video_id,
            title: v.title,
            duration: v.duration,
            view_count: formatViewCount(v.view_count.toString()),
            is_short: v.is_short,
            published_at: v.published_at
          }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'list') {
      console.log('Listing videos from database...');
      
      let query = supabaseClient
        .from('youtube_videos')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(limit)

      if (shortsOnly) {
        console.log('Filtering for shorts only');
        query = query.eq('is_short', true)
      }

      const { data: videos, error } = await query

      if (error) {
        console.error('Database query error:', error);
        throw new Error(`Database query error: ${error.message}`)
      }

      console.log(`Found ${videos?.length || 0} videos in database`);

      // Format for frontend
      const formattedVideos = videos?.map(video => ({
        id: video.id,
        video_id: video.video_id,
        title: video.title,
        thumbnail: video.thumbnail_url,
        videoId: video.video_id,
        duration: video.duration,
        views: formatViewCount(video.view_count.toString()),
        publishedAt: formatPublishedDate(video.published_at),
        isShort: video.is_short,
        description: video.description
      })) || []

      const response = { videos: formattedVideos, count: formattedVideos.length };
      console.log('Returning response:', JSON.stringify(response, null, 2));
      
      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use ?action=fetch or ?action=list' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('YouTube API Error:', error)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information',
        timestamp: new Date().toISOString(),
        url: req.url
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Helper function to format published date
function formatPublishedDate(publishedAt: string): string {
  const now = new Date()
  const published = new Date(publishedAt)
  const diffMs = now.getTime() - published.getTime()
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  
  if (diffHours < 24) {
    return diffHours <= 1 ? '1 Stunde' : `${diffHours} Stunden`
  } else if (diffDays < 7) {
    return diffDays === 1 ? '1 Tag' : `${diffDays} Tage`
  } else if (diffWeeks < 4) {
    return diffWeeks === 1 ? '1 Woche' : `${diffWeeks} Wochen`
  } else {
    return diffMonths === 1 ? '1 Monat' : `${diffMonths} Monate`
  }
}