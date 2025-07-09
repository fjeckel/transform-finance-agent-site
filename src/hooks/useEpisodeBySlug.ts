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
      if (error) throw error;
      return data || [];
    },
  });
};