import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Episode } from './useEpisodes';

export interface LocalizedEpisode extends Omit<Episode, 'title' | 'description' | 'content' | 'summary'> {
  title: string;
  description: string;
  content: string;
  summary?: string;
  language_code: string;
  is_translated: boolean;
  translation_quality_score?: number;
}

export const useLocalizedEpisodes = (language: string = 'de') => {
  return useQuery({
    queryKey: ['localized-episodes', language],
    queryFn: async () => {
      // First get base episodes
      const { data: baseEpisodes, error } = await supabase
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

      if (!baseEpisodes || baseEpisodes.length === 0) {
        return [];
      }

      // Get translations for the specified language (include all saved translations)
      const { data: translations } = await supabase
        .from('episodes_translations')
        .select('*')
        .in('episode_id', baseEpisodes.map(e => e.id))
        .eq('language_code', language)
        .in('translation_status', ['completed', 'approved', 'draft', 'pending']);

      // Create a map of translations by episode_id
      const translationMap = new Map(
        translations?.map(t => [t.episode_id, t]) || []
      );

      // Merge base episodes with translations
      const localizedEpisodes: LocalizedEpisode[] = baseEpisodes.map(episode => {
        const translation = translationMap.get(episode.id);
        
        return {
          ...episode,
          // Format guests and platforms as expected
          guests: episode.episode_guests.map((eg: any) => eg.guests),
          platforms: episode.episode_platforms,
          
          // Use translated content if available, fallback to original
          title: translation?.title || episode.title,
          description: translation?.description || episode.description,
          content: translation?.content || episode.content,
          summary: translation?.summary || episode.summary,
          
          // Translation metadata
          language_code: language,
          is_translated: !!translation,
          translation_quality_score: translation?.translation_quality_score,
        };
      });

      return localizedEpisodes;
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
};

export const useLocalizedEpisodeBySlug = (slug: string, language: string = 'de') => {
  return useQuery({
    queryKey: ['localized-episode', slug, language],
    queryFn: async () => {
      // First get the base episode
      const { data: episode, error } = await supabase
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
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      if (!episode) return null;

      // Get translation if available (include all saved translations)
      const { data: translation } = await supabase
        .from('episodes_translations')
        .select('*')
        .eq('episode_id', episode.id)
        .eq('language_code', language)
        .in('translation_status', ['completed', 'approved', 'draft', 'pending'])
        .maybeSingle();

      // Return localized episode
      const localizedEpisode: LocalizedEpisode = {
        ...episode,
        // Format guests and platforms as expected
        guests: episode.episode_guests.map((eg: any) => eg.guests),
        platforms: episode.episode_platforms,
        
        // Use translated content if available, fallback to original
        title: translation?.title || episode.title,
        description: translation?.description || episode.description,
        content: translation?.content || episode.content,
        summary: translation?.summary || episode.summary,
        
        // Translation metadata
        language_code: language,
        is_translated: !!translation,
        translation_quality_score: translation?.translation_quality_score,
      };

      return localizedEpisode;
    },
    enabled: !!slug,
  });
};

// Hook to get available languages for a specific episode
export const useEpisodeTranslationStatus = (episodeId: string) => {
  return useQuery({
    queryKey: ['episode-translation-status', episodeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('episodes_translations')
        .select(`
          language_code,
          translation_status,
          translation_quality_score,
          translated_at
        `)
        .eq('episode_id', episodeId);

      if (error) throw error;

      // Always include the default language (German)
      const translations = data || [];
      const availableLanguages = ['de']; // German is always available (original)
      
      // Add languages with any saved translations
      translations
        .filter(t => ['completed', 'approved', 'draft', 'pending'].includes(t.translation_status))
        .forEach(t => {
          if (!availableLanguages.includes(t.language_code)) {
            availableLanguages.push(t.language_code);
          }
        });

      return {
        availableLanguages,
        translations: translations.reduce((acc, t) => {
          acc[t.language_code] = {
            status: t.translation_status,
            quality: t.translation_quality_score,
            translatedAt: t.translated_at,
          };
          return acc;
        }, {} as Record<string, any>),
      };
    },
    enabled: !!episodeId,
  });
};

// Legacy hook for backward compatibility - can be phased out gradually
export const useEpisodes = (language?: string) => {
  const [episodes, setEpisodes] = useState<LocalizedEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, error: queryError, refetch } = useLocalizedEpisodes(language || 'de');

  useEffect(() => {
    if (data) {
      setEpisodes(data);
      setLoading(false);
      setError(null);
    } else if (queryError) {
      setError('Failed to load episodes');
      setLoading(false);
    } else {
      setLoading(isLoading);
    }
  }, [data, isLoading, queryError]);

  return { 
    episodes, 
    loading, 
    error, 
    refetch: () => refetch().then(() => {}) 
  };
};