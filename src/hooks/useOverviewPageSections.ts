import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OverviewPageSection {
  id: string;
  section_key: string;
  title: string;
  subtitle?: string;
  description?: string;
  background_color: string;
  text_color: string;
  section_type: string;
  sort_order: number;
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

export const useOverviewPageSections = () => {
  return useQuery({
    queryKey: ['overview-page-sections'],
    queryFn: async () => {
      const { data: sections, error } = await supabase
        .from('main_page_sections')
        .select(`
          *,
          content:section_content(*),
          links:section_links(*)
        `)
        .eq('page_type', 'overview')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      // Sort links within each section and convert to proper structure
      const sectionsWithSortedLinks = sections?.map(section => ({
        ...section,
        links: section.links?.sort((a: any, b: any) => a.sort_order - b.sort_order) || []
      })) as OverviewPageSection[];

      return sectionsWithSortedLinks || [];
    },
  });
};

export const useOverviewPageSectionByKey = (sectionKey: string) => {
  return useQuery({
    queryKey: ['overview-page-section', sectionKey],
    queryFn: async () => {
      const { data: section, error } = await supabase
        .from('main_page_sections')
        .select(`
          *,
          content:section_content(*),
          links:section_links(*)
        `)
        .eq('page_type', 'overview')
        .eq('section_key', sectionKey)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      // Sort links
      const sectionWithSortedLinks = {
        ...section,
        links: section.links?.sort((a: any, b: any) => a.sort_order - b.sort_order) || []
      } as OverviewPageSection;

      return sectionWithSortedLinks;
    },
  });
};

// Helper function to get content by key from a section
export const getContentValue = (section: OverviewPageSection, contentKey: string): string => {
  const content = section.content?.find(c => c.content_key === contentKey);
  return content?.content_value || '';
};

// Helper function to get all content of a specific type
export const getContentByType = (section: OverviewPageSection, contentType: string) => {
  return section.content?.filter(c => c.content_type === contentType) || [];
};