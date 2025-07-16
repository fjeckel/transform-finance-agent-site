import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MainPageSection {
  id: string;
  section_key: string;
  title: string;
  subtitle?: string;
  description?: string;
  background_color: string;
  text_color: string;
  is_active: boolean;
  sort_order: number;
  section_type: string;
  content?: Array<{
    id: string;
    content_type: string;
    content_key: string;
    content_value: string;
    metadata?: any;
  }>;
  links?: Array<{
    id: string;
    link_type: string;
    platform_name: string;
    url: string;
    display_text?: string;
    color: string;
    icon?: string;
    sort_order: number;
  }>;
}

export const useMainPageSections = () => {
  return useQuery({
    queryKey: ['main-page-sections'],
    queryFn: async () => {
      const { data: sections, error: sectionsError } = await supabase
        .from('main_page_sections')
        .select(`
          *,
          content:section_content(*),
          links:section_links(*)
        `)
        .eq('is_active', true)
        .order('sort_order');

      if (sectionsError) throw sectionsError;

      // Sort links within each section
      const sectionsWithSortedLinks = sections?.map(section => ({
        ...section,
        links: section.links?.sort((a: any, b: any) => a.sort_order - b.sort_order) || []
      })) as MainPageSection[];

      return sectionsWithSortedLinks || [];
    },
  });
};

export const useMainPageSectionByKey = (sectionKey: string) => {
  return useQuery({
    queryKey: ['main-page-section', sectionKey],
    queryFn: async () => {
      const { data: section, error } = await supabase
        .from('main_page_sections')
        .select(`
          *,
          content:section_content(*),
          links:section_links(*)
        `)
        .eq('section_key', sectionKey)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      // Sort links
      const sectionWithSortedLinks = {
        ...section,
        links: section.links?.sort((a: any, b: any) => a.sort_order - b.sort_order) || []
      } as MainPageSection;

      return sectionWithSortedLinks;
    },
  });
};