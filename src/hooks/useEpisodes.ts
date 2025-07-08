
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Episode {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  season: number;
  episode_number: number;
  duration: string;
  publish_date: string;
  image_url: string;
  audio_url: string;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  series?: 'wtf' | 'finance_transformers' | 'cfo_memo';
  guests: Array<{
    id: string;
    name: string;
    bio: string;
    image_url: string;
  }>;
  platforms: Array<{
    platform_name: string;
    platform_url: string;
  }>;
}

export const useEpisodes = () => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEpisodes();
  }, []);

  const fetchEpisodes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('episodes')
        .select(`
          *,
          episode_guests (
            guests (
              id,
              name,
              bio,
              image_url
            )
          ),
          episode_platforms (
            platform_name,
            platform_url
          )
        `)
        .eq('status', 'published')
        .order('publish_date', { ascending: false });

      if (error) throw error;

      const formattedEpisodes = data.map(episode => ({
        ...episode,
        guests: episode.episode_guests.map((eg: any) => eg.guests),
        platforms: episode.episode_platforms,
      }));

      setEpisodes(formattedEpisodes);
    } catch (error) {
      console.error('Error fetching episodes:', error);
      setError('Failed to load episodes');
    } finally {
      setLoading(false);
    }
  };

  return { episodes, loading, error, refetch: fetchEpisodes };
};
