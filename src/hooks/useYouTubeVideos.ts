import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface YouTubeVideo {
  id: string;
  video_id: string;
  title: string;
  description?: string;
  thumbnail: string; // Alias for thumbnail_url
  videoId: string; // Alias for video_id
  duration: string;
  views: string;
  publishedAt: string;
  isShort?: boolean;
}

interface YouTubeVideoResponse {
  videos: YouTubeVideo[];
  count: number;
}

export const useYouTubeVideos = (shortsOnly: boolean = false, limit: number = 20) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, [shortsOnly, limit]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to get videos from the Edge Function
      const params = new URLSearchParams({
        action: 'list',
        limit: limit.toString()
      });

      if (shortsOnly) {
        params.append('shorts_only', 'true');
      }

      const { data, error: functionError } = await supabase.functions.invoke('youtube-videos', {
        method: 'GET',
        body: JSON.stringify(Object.fromEntries(params)),
      });

      if (functionError) {
        console.warn('Edge function error, falling back to direct database query:', functionError);
        // Fallback to direct database query
        await fetchFromDatabase();
        return;
      }

      if (data?.videos) {
        setVideos(data.videos);
      } else {
        // If no videos from function, try to fetch fresh data
        await fetchFreshVideos();
      }
    } catch (err) {
      console.error('Error fetching YouTube videos:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
      // Fallback to mock data in case of complete failure
      setVideos(getMockVideos());
    } finally {
      setLoading(false);
    }
  };

  const fetchFromDatabase = async () => {
    let query = supabase
      .from('youtube_videos')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (shortsOnly) {
      query = query.eq('is_short', true);
    }

    const { data: dbVideos, error: dbError } = await query;

    if (dbError) {
      throw dbError;
    }

    if (dbVideos && dbVideos.length > 0) {
      const formattedVideos = dbVideos.map(video => ({
        id: video.id,
        video_id: video.video_id,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail_url,
        videoId: video.video_id,
        duration: video.duration,
        views: formatViewCount(video.view_count),
        publishedAt: formatPublishedDate(video.published_at),
        isShort: video.is_short
      }));
      setVideos(formattedVideos);
    } else {
      // If database is empty, try to fetch fresh videos
      await fetchFreshVideos();
    }
  };

  const fetchFreshVideos = async () => {
    const { data, error: fetchError } = await supabase.functions.invoke('youtube-videos', {
      method: 'GET',
      body: null,
    });

    if (fetchError) {
      throw fetchError;
    }

    if (data?.videos) {
      setVideos(data.videos);
    } else {
      // Ultimate fallback to mock data
      setVideos(getMockVideos());
    }
  };

  const refreshVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the fetch action to update videos from YouTube API
      const { data, error: refreshError } = await supabase.functions.invoke('youtube-videos', {
        method: 'GET',
        body: JSON.stringify({ action: 'fetch', limit }),
      });

      if (refreshError) {
        throw refreshError;
      }

      // After fetching fresh data, get the updated list
      await fetchVideos();
    } catch (err) {
      console.error('Error refreshing videos:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh videos');
    } finally {
      setLoading(false);
    }
  };

  return {
    videos,
    loading,
    error,
    refreshVideos,
    refetch: fetchVideos
  };
};

// Helper functions
function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

function formatPublishedDate(publishedAt: string): string {
  const now = new Date();
  const published = new Date(publishedAt);
  const diffMs = now.getTime() - published.getTime();
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  if (diffHours < 24) {
    return diffHours <= 1 ? '1 Stunde' : `${diffHours} Stunden`;
  } else if (diffDays < 7) {
    return diffDays === 1 ? '1 Tag' : `${diffDays} Tage`;
  } else if (diffWeeks < 4) {
    return diffWeeks === 1 ? '1 Woche' : `${diffWeeks} Wochen`;
  } else {
    return diffMonths === 1 ? '1 Monat' : `${diffMonths} Monate`;
  }
}

function getMockVideos(): YouTubeVideo[] {
  return [
    {
      id: 'mock1',
      video_id: 'nBQKMPWrUgc',
      title: 'CFO Transformation in 60 Sekunden',
      thumbnail: 'https://img.youtube.com/vi/nBQKMPWrUgc/maxresdefault.jpg',
      videoId: 'nBQKMPWrUgc',
      duration: '0:58',
      views: '1.2K',
      publishedAt: '2 Tage',
      isShort: true
    },
    {
      id: 'mock2',
      video_id: 'dQw4w9WgXcQ',
      title: 'KI im Controlling - Game Changer?',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      videoId: 'dQw4w9WgXcQ',
      duration: '0:45',
      views: '892',
      publishedAt: '5 Tage',
      isShort: true
    },
    {
      id: 'mock3',
      video_id: 'jNQXAC9IVRw',
      title: 'Excel vs. Modern FP&A Tools',
      thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
      videoId: 'jNQXAC9IVRw',
      duration: '1:00',
      views: '2.1K',
      publishedAt: '1 Woche',
      isShort: true
    },
    {
      id: 'mock4',
      video_id: 'ZZ5LpwO-An4',
      title: 'Finance Automation Basics',
      thumbnail: 'https://img.youtube.com/vi/ZZ5LpwO-An4/maxresdefault.jpg',
      videoId: 'ZZ5LpwO-An4',
      duration: '0:52',
      views: '1.5K',
      publishedAt: '2 Wochen',
      isShort: true
    }
  ];
}