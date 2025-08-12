import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Episode } from '@/hooks/useEpisodes';
import { Insight } from '@/hooks/useInsights';
import { ContentReference } from '../types/paths';

export interface RecommendedContent {
  episodes: Episode[];
  insights: Insight[];
  loading: boolean;
  error: string | null;
}

export const useContentRecommendations = (pathId: string): RecommendedContent => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendedContent = async () => {
      setLoading(true);
      setError(null);

      try {
        // Define content recommendations based on learning path
        const contentMappings = getContentMappingByPath(pathId);
        
        // Fetch episodes
        const { data: episodesData, error: episodesError } = await supabase
          .from('episodes')
          .select(`
            id,
            title,
            slug,
            description,
            summary,
            season,
            episode_number,
            duration,
            publish_date,
            image_url,
            audio_url,
            status,
            series
          `)
          .eq('status', 'published')
          .in('slug', contentMappings.episodes.map(e => e.slug))
          .order('publish_date', { ascending: false });

        if (episodesError) {
          console.error('Error fetching episodes:', episodesError);
          setError('Failed to load episode recommendations');
        } else {
          // Map episodes to match the order of recommendations
          const orderedEpisodes = contentMappings.episodes
            .map(rec => episodesData?.find(ep => ep.slug === rec.slug))
            .filter((ep): ep is Episode => ep !== undefined);
          setEpisodes(orderedEpisodes);
        }

        // Fetch insights
        const { data: insightsData, error: insightsError } = await supabase
          .from('insights')
          .select(`
            id,
            title,
            slug,
            subtitle,
            description,
            summary,
            insight_type,
            status,
            difficulty_level,
            estimated_read_time,
            image_url,
            created_at
          `)
          .eq('status', 'published')
          .in('slug', contentMappings.insights.map(i => i.slug))
          .order('created_at', { ascending: false });

        if (insightsError) {
          console.error('Error fetching insights:', insightsError);
          setError('Failed to load insight recommendations');
        } else {
          // Map insights to match the order of recommendations
          const orderedInsights = contentMappings.insights
            .map(rec => insightsData?.find(ins => ins.slug === rec.slug))
            .filter((ins): ins is Insight => ins !== undefined);
          setInsights(orderedInsights);
        }

      } catch (err) {
        console.error('Error fetching content recommendations:', err);
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedContent();
  }, [pathId]);

  return { episodes, insights, loading, error };
};

// Content mappings for each learning path
const getContentMappingByPath = (pathId: string) => {
  const mappings: Record<string, { episodes: { slug: string }[], insights: { slug: string }[] }> = {
    'finance_transformation_basics': {
      episodes: [
        { slug: 'finance-transformation-101' },
        { slug: 'finance-quick-wins' },
        { slug: 'digital-finance-tools-overview' }
      ],
      insights: [
        { slug: 'transformation-assessment-framework' },
        { slug: 'finance-process-optimization-guide' },
        { slug: 'change-management-checklist' }
      ]
    },
    'transformation_leadership': {
      episodes: [
        { slug: 'cfo-interview-digitalization' },
        { slug: 'stakeholder-management-finance' },
        { slug: 'transformation-roi-measurement' }
      ],
      insights: [
        { slug: 'transformation-leadership-playbook' },
        { slug: 'finance-team-development-guide' },
        { slug: 'change-communication-framework' }
      ]
    },
    'specific_solutions': {
      episodes: [
        { slug: 'ai-finance-implementation' },
        { slug: 'advanced-analytics-finance' },
        { slug: 'automation-case-studies' }
      ],
      insights: [
        { slug: 'advanced-analytics-framework' },
        { slug: 'ai-implementation-checklist' },
        { slug: 'tech-integration-guide' }
      ]
    }
  };

  return mappings[pathId] || { episodes: [], insights: [] };
};

// Fallback content recommendations when specific content isn't available
export const getFallbackRecommendations = async (pathId: string, difficulty: 'beginner' | 'intermediate' | 'advanced') => {
  try {
    // Get latest episodes
    const { data: episodes } = await supabase
      .from('episodes')
      .select(`
        id, title, slug, description, summary, duration,
        publish_date, image_url, audio_url, series
      `)
      .eq('status', 'published')
      .order('publish_date', { ascending: false })
      .limit(6);

    // Get relevant insights based on difficulty
    const { data: insights } = await supabase
      .from('insights')
      .select(`
        id, title, slug, subtitle, description, summary,
        insight_type, difficulty_level, estimated_read_time, image_url
      `)
      .eq('status', 'published')
      .eq('difficulty_level', difficulty)
      .order('created_at', { ascending: false })
      .limit(4);

    return { episodes: episodes || [], insights: insights || [] };
  } catch (error) {
    console.error('Error fetching fallback recommendations:', error);
    return { episodes: [], insights: [] };
  }
};