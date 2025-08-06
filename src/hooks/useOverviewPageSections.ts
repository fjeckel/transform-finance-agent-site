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

      // If no overview sections found, return fallback content
      if (!sectionsWithSortedLinks || sectionsWithSortedLinks.length === 0) {
        return getFallbackOverviewSections();
      }

      return sectionsWithSortedLinks;
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

// Fallback content when no overview sections are found in database
const getFallbackOverviewSections = (): OverviewPageSection[] => {
  return [
    {
      id: 'fallback-hero',
      section_key: 'hero',
      title: 'Die Welt der Finance Transformers',
      subtitle: null,
      description: 'Willkommen in unserem Universum der Finanztransformation. Hier findest du alles, was du über unsere verschiedenen Formate und Inhalte wissen musst.',
      background_color: '#ffffff',
      text_color: '#000000',
      section_type: 'hero',
      sort_order: 1,
      content: [],
      links: []
    },
    {
      id: 'fallback-episodes',
      section_key: 'episodes_service',
      title: 'Episoden & Podcasts',
      subtitle: 'Höre unsere Podcast-Folgen',
      description: 'Entdecke alle unsere Podcast-Episoden zu Finance Transformation, Tools und Best Practices.',
      background_color: '#13B87B',
      text_color: '#ffffff',
      section_type: 'service_card',
      sort_order: 2,
      content: [],
      links: [
        {
          id: 'fallback-episodes-link',
          link_type: 'button',
          platform_name: 'Episoden',
          url: '/episodes',
          display_text: 'Alle Episoden ansehen',
          color: '#ffffff',
          sort_order: 1
        }
      ]
    },
    {
      id: 'fallback-insights',
      section_key: 'insights_service',
      title: 'Insights & CFO Memos',
      subtitle: 'Lies unsere Insights',
      description: 'Tiefgehende Analysen, CFO Memos und praktische Insights für Finance Professionals.',
      background_color: '#003FA5',
      text_color: '#ffffff',
      section_type: 'service_card',
      sort_order: 3,
      content: [],
      links: [
        {
          id: 'fallback-insights-link',
          link_type: 'button',
          platform_name: 'Insights',
          url: '/insights',
          display_text: 'Alle Insights lesen',
          color: '#ffffff',
          sort_order: 1
        }
      ]
    },
    {
      id: 'fallback-wtf',
      section_key: 'wtf_info',
      title: 'Was ist WTF?!',
      subtitle: 'WTF?! - Warum Finance Transformieren',
      description: 'Unser Hauptpodcast, der sich den großen Fragen der Finanztransformation widmet.',
      background_color: '#ffffff',
      text_color: '#000000',
      section_type: 'info_card',
      sort_order: 4,
      content: [
        {
          id: 'fallback-wtf-mission-title',
          content_type: 'text',
          content_key: 'mission_title',
          content_value: 'Mission'
        },
        {
          id: 'fallback-wtf-mission-text',
          content_type: 'text',
          content_key: 'mission_text',
          content_value: 'Wir hinterfragen bestehende Finanzprozesse und zeigen neue Wege auf'
        },
        {
          id: 'fallback-wtf-audience-title',
          content_type: 'text',
          content_key: 'audience_title',
          content_value: 'Für wen?'
        },
        {
          id: 'fallback-wtf-audience-text',
          content_type: 'text',
          content_key: 'audience_text',
          content_value: 'CFOs, Finance Manager und alle, die Finanzprozesse transformieren wollen'
        }
      ],
      links: [
        {
          id: 'fallback-wtf-link',
          link_type: 'button',
          platform_name: 'WTF?! Episoden',
          url: '/episodes',
          display_text: 'WTF?! Episoden ansehen',
          color: '#13B87B',
          sort_order: 1
        }
      ]
    },
    {
      id: 'fallback-cfo-memo',
      section_key: 'cfo_memo_info',
      title: 'Was ist CFO Memo?',
      subtitle: 'CFO Memos',
      description: 'Kompakte, praxisorientierte Dokumente, die komplexe Finanzthemen auf den Punkt bringen.',
      background_color: '#ffffff',
      text_color: '#000000',
      section_type: 'info_card',
      sort_order: 5,
      content: [
        {
          id: 'fallback-cfo-format-title',
          content_type: 'text',
          content_key: 'format_title',
          content_value: 'Format'
        },
        {
          id: 'fallback-cfo-format-text',
          content_type: 'text',
          content_key: 'format_text',
          content_value: 'Strukturierte PDF-Dokumente mit konkreten Handlungsempfehlungen'
        },
        {
          id: 'fallback-cfo-audience-title',
          content_type: 'text',
          content_key: 'audience_title',
          content_value: 'Zielgruppe'
        },
        {
          id: 'fallback-cfo-audience-text',
          content_type: 'text',
          content_key: 'audience_text',
          content_value: 'Führungskräfte im Finance-Bereich, die schnelle Lösungen brauchen'
        }
      ],
      links: [
        {
          id: 'fallback-cfo-link',
          link_type: 'button',
          platform_name: 'CFO Memos',
          url: '/episodes?tab=memos',
          display_text: 'CFO Memos entdecken',
          color: '#003FA5',
          sort_order: 1
        }
      ]
    },
    {
      id: 'fallback-cta',
      section_key: 'cta',
      title: 'Bereit für deine Finance Transformation?',
      subtitle: null,
      description: 'Egal ob du gerade erst anfängst oder schon mittendrin bist - bei uns findest du die passenden Inhalte für jeden Schritt deiner Reise.',
      background_color: '#f8f9fa',
      text_color: '#000000',
      section_type: 'cta',
      sort_order: 6,
      content: [],
      links: [
        {
          id: 'fallback-cta-episodes',
          link_type: 'button',
          platform_name: 'Alle Inhalte',
          url: '/episodes',
          display_text: 'Alle Inhalte entdecken',
          color: '#13B87B',
          sort_order: 1
        },
        {
          id: 'fallback-cta-home',
          link_type: 'button',
          platform_name: 'Mehr über uns',
          url: '/',
          display_text: 'Mehr über uns erfahren',
          color: '#6c757d',
          sort_order: 2
        }
      ]
    }
  ];
};