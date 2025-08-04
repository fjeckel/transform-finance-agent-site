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
      const { data, error } = await supabase.rpc('get_translation_stats');
      
      if (error) {
        console.error('Error fetching translation stats:', error);
        throw error;
      }
      
      return data as TranslationStats[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};