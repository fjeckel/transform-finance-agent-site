import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InsightType, Insight } from './useInsights';

export interface LocalizedInsight extends Omit<Insight, 'title' | 'subtitle' | 'description' | 'content' | 'summary' | 'book_title' | 'book_author' | 'tags' | 'keywords'> {
  title: string;
  subtitle?: string;
  description?: string;
  content: string;
  summary?: string;
  book_title?: string;
  book_author?: string;
  tags?: string[];
  keywords?: string[];
  language_code: string;
  is_translated: boolean;
  translation_quality_score?: number;
}

export const useLocalizedInsights = (
  language: string = 'de',
  filters?: {
    type?: InsightType;
    category?: string;
    featured?: boolean;
    limit?: number;
  }
) => {
  return useQuery({
    queryKey: ['localized-insights', language, filters],
    queryFn: async () => {
      // First get base insights
      let query = supabase
        .from('insights')
        .select(`
          *,
          insights_categories (
            id,
            name,
            slug,
            description,
            color,
            icon
          )
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('insight_type', filters.type);
      }

      if (filters?.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters?.featured !== undefined) {
        query = query.eq('featured', filters.featured);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data: baseInsights, error } = await query;
      if (error) throw error;

      if (!baseInsights || baseInsights.length === 0) {
        return [];
      }

      // Get translations for the specified language
      const { data: translations } = await supabase
        .from('insights_translations')
        .select('*')
        .in('insight_id', baseInsights.map(i => i.id))
        .eq('language_code', language)
        .eq('translation_status', 'approved');

      // Create a map of translations by insight_id
      const translationMap = new Map(
        translations?.map(t => [t.insight_id, t]) || []
      );

      // Merge base insights with translations
      const localizedInsights: LocalizedInsight[] = baseInsights.map(insight => {
        const translation = translationMap.get(insight.id);
        
        return {
          ...insight,
          // Use translated content if available, fallback to original
          title: translation?.title || insight.title,
          subtitle: translation?.subtitle || insight.subtitle,
          description: translation?.description || insight.description,
          content: translation?.content || insight.content,
          summary: translation?.summary || insight.summary,
          book_title: translation?.book_title || insight.book_title,
          book_author: translation?.book_author || insight.book_author,
          tags: translation?.tags || insight.tags,
          keywords: translation?.keywords || insight.keywords,
          
          // Translation metadata
          language_code: language,
          is_translated: !!translation,
          translation_quality_score: translation?.translation_quality_score,
        };
      });

      return localizedInsights;
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
};

export const useLocalizedInsightBySlug = (slug: string, language: string = 'de') => {
  return useQuery({
    queryKey: ['localized-insight', slug, language],
    queryFn: async () => {
      // First get the base insight
      const { data: insight, error } = await supabase
        .from('insights')
        .select(`
          *,
          insights_categories (
            id,
            name,
            slug,
            description,
            color,
            icon
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      if (!insight) return null;

      // Get translation if available
      const { data: translation } = await supabase
        .from('insights_translations')
        .select('*')
        .eq('insight_id', insight.id)
        .eq('language_code', language)
        .eq('translation_status', 'approved')
        .maybeSingle();

      // Increment view count
      await supabase
        .from('insights')
        .update({ view_count: (insight.view_count || 0) + 1 })
        .eq('id', insight.id);

      // Return localized insight
      const localizedInsight: LocalizedInsight = {
        ...insight,
        // Use translated content if available, fallback to original
        title: translation?.title || insight.title,
        subtitle: translation?.subtitle || insight.subtitle,
        description: translation?.description || insight.description,
        content: translation?.content || insight.content,
        summary: translation?.summary || insight.summary,
        book_title: translation?.book_title || insight.book_title,
        book_author: translation?.book_author || insight.book_author,
        tags: translation?.tags || insight.tags,
        keywords: translation?.keywords || insight.keywords,
        
        // Translation metadata
        language_code: language,
        is_translated: !!translation,
        translation_quality_score: translation?.translation_quality_score,
      };

      return localizedInsight;
    },
    enabled: !!slug,
  });
};

// Hook to get available languages for a specific insight
export const useInsightTranslationStatus = (insightId: string) => {
  return useQuery({
    queryKey: ['insight-translation-status', insightId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insights_translations')
        .select(`
          language_code,
          translation_status,
          translation_quality_score,
          translated_at
        `)
        .eq('insight_id', insightId);

      if (error) throw error;

      // Always include the default language (German)
      const translations = data || [];
      const availableLanguages = ['de']; // German is always available (original)
      
      // Add languages with approved translations
      translations
        .filter(t => t.translation_status === 'approved')
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
    enabled: !!insightId,
  });
};