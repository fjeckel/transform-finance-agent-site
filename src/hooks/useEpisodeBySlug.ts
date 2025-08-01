import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useEpisodeBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['episode', slug],
    queryFn: async () => {
      const { data: episode, error } = await supabase
        .from('episodes')
        .select(`
          *,
          show_notes!left(
            id,
            timestamp,
            title,
            content,
            sort_order
          ),
          episode_platforms!left(
            platform_name,
            platform_url
          ),
          episode_guests!left(
            guests!left(
              id,
              name,
              bio,
              image_url
            )
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      return episode;
    },
    enabled: !!slug,
  });
};

export const useEpisodesBySeriesPublished = (series: 'wtf' | 'finance_transformers' | 'cfo_memo', limit?: number) => {
  return useQuery({
    queryKey: ['episodes', series, 'published', limit],
    queryFn: async () => {
      try {
        let query = supabase
          .from('episodes')
          .select(`
            *,
            episode_platforms!left(
              platform_name,
              platform_url
            ),
            episode_guests!left(
              guests!left(
                id,
                name,
                bio,
                image_url
              )
            )
          `)
          .eq('series', series)
          .eq('status', 'published')
          .order('episode_number', { ascending: false });

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;
        if (error) {
          console.error(`Error fetching ${series} episodes:`, error);
          throw error;
        }
        
        // Ensure we always return an array, even if data is null
        const episodes = data || [];
        
        // Validate episode data structure
        const validEpisodes = episodes.filter(episode => {
          if (!episode || !episode.id || !episode.title) {
            console.warn('Invalid episode data:', episode);
            return false;
          }
          return true;
        });
        
        return validEpisodes;
      } catch (error) {
        console.error(`Failed to fetch ${series} episodes:`, error);
        throw error;
      }
    },
    // Add retry and error handling
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};