import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TranslationStats {
  language_code: string;
  language_name: string;
  insights_total: number;
  insights_translated: number;
  insights_completion_pct: number;
  episodes_total: number;
  episodes_translated: number;
  episodes_completion_pct: number;
}

export const useTranslationStats = () => {
  return useQuery({
    queryKey: ['translation-stats'],
    queryFn: async () => {
      // Try to use the translation_stats function first
      try {
        const { data, error } = await supabase.functions.invoke('translation_stats');
        
        if (error) {
          throw error;
        }
        
        return data as TranslationStats[];
      } catch (error) {
        console.error('Error fetching translation stats:', error);
        
        // Fallback to mock data if the function doesn't exist yet
        const fallbackStats: TranslationStats[] = [
          {
            language_code: 'de',
            language_name: 'German',
            insights_total: 0,
            insights_translated: 0,
            insights_completion_pct: 0,
            episodes_total: 0,
            episodes_translated: 0,
            episodes_completion_pct: 0
          },
          {
            language_code: 'en',
            language_name: 'English',
            insights_total: 0,
            insights_translated: 0,
            insights_completion_pct: 0,
            episodes_total: 0,
            episodes_translated: 0,
            episodes_completion_pct: 0
          }
        ];
        
        return fallbackStats;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};