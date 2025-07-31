import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type InsightType = 'book_summary' | 'blog_article' | 'guide' | 'case_study';
export type InsightStatus = 'draft' | 'published' | 'archived' | 'scheduled';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface InsightCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order: number;
}

export interface Insight {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  description?: string;
  content: string;
  summary?: string;
  insight_type: InsightType;
  status: InsightStatus;
  
  // Book summary specific fields
  book_title?: string;
  book_author?: string;
  book_isbn?: string;
  book_publication_year?: number;
  
  // Content metadata
  reading_time_minutes?: number;
  difficulty_level?: DifficultyLevel;
  
  // Media
  image_url?: string;
  thumbnail_url?: string;
  
  // SEO and categorization
  tags?: string[];
  keywords?: string[];
  category?: string;
  category_id?: string;
  
  // Publishing metadata
  published_at?: string;
  featured: boolean;
  view_count: number;
  
  // Relations
  insights_categories?: InsightCategory;
  
  // Audit fields
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useInsights = (filters?: {
  type?: InsightType;
  category?: string;
  featured?: boolean;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['insights', filters],
    queryFn: async () => {
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

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Insight[];
    },
  });
};

export const useInsightBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['insight', slug],
    queryFn: async () => {
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
      
      // Increment view count
      if (insight) {
        await supabase
          .from('insights')
          .update({ view_count: (insight.view_count || 0) + 1 })
          .eq('id', insight.id);
      }
      
      return insight as Insight | null;
    },
    enabled: !!slug,
  });
};

export const useInsightCategories = () => {
  return useQuery({
    queryKey: ['insight-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insights_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as InsightCategory[];
    },
  });
};

export const useFeaturedInsights = (limit: number = 3) => {
  return useInsights({ featured: true, limit });
};

export const useInsightsByType = (type: InsightType, limit?: number) => {
  return useInsights({ type, limit });
};