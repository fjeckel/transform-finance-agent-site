-- Overview Page CMS Support
-- Extend existing main_page_sections to support Overview page with same flexibility

-- Add page_type column to distinguish between main and overview pages
ALTER TABLE public.main_page_sections 
ADD COLUMN IF NOT EXISTS page_type TEXT DEFAULT 'main' CHECK (page_type IN ('main', 'overview'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_main_page_sections_page_type ON public.main_page_sections(page_type, is_active, sort_order);

-- Insert Overview page sections with current static content
INSERT INTO public.main_page_sections (
  page_type, section_key, title, subtitle, description, section_type, sort_order, background_color, text_color
) VALUES 
(
  'overview', 
  'hero', 
  'Die Welt der Finance Transformers', 
  NULL,
  'Willkommen in unserem Universum der Finanztransformation. Hier findest du alles, was du über unsere verschiedenen Formate und Inhalte wissen musst.',
  'overview_hero', 
  1,
  'transparent',
  'inherit'
),
(
  'overview', 
  'wtf_explanation', 
  'Was ist WTF?!',
  'Warum Finance Transformieren', 
  'WTF?! - Warum Finance Transformieren ist unser Hauptpodcast, der sich den großen Fragen der Finanztransformation widmet.',
  'service_card', 
  2,
  'linear-gradient(to right, #13B87B, #0F9A6A)',
  'white'
),
(
  'overview', 
  'cfo_memo_explanation', 
  'Was ist CFO Memo?',
  'Kompakte Finanz-Insights', 
  'CFO Memos sind kompakte, praxisorientierte Dokumente, die komplexe Finanzthemen auf den Punkt bringen.',
  'service_card', 
  3,
  'linear-gradient(to right, #003FA5, #0056E0)',
  'white'
),
(
  'overview', 
  'tool_time_explanation', 
  'Was ist Tool Time by WTF?!',
  'Deep Dives in die Tools und Technologien der Finanztransformation', 
  'Tool Time ist unser Spezialformat für alle, die tief in die technische Seite der Finanztransformation eintauchen wollen.',
  'feature_overview', 
  4,
  'linear-gradient(to right, #7C3AED, #6D28D9)',
  'white'
),
(
  'overview', 
  'cta_section', 
  'Bereit für deine Finance Transformation?',
  NULL,
  'Egal ob du gerade erst anfängst oder schon mittendrin bist - bei uns findest du die passenden Inhalte für jeden Schritt deiner Reise.',
  'call_to_action', 
  5,
  'linear-gradient(to right, rgba(19, 184, 123, 0.1), rgba(0, 63, 165, 0.1))',
  'inherit'
);

-- Insert detailed content for WTF section
INSERT INTO public.section_content (section_id, content_type, content_key, content_value) 
SELECT s.id, content_type, content_key, content_value FROM public.main_page_sections s,
(VALUES 
  ('text', 'mission_title', 'Mission'),
  ('text', 'mission_description', 'Wir hinterfragen bestehende Finanzprozesse und zeigen neue Wege auf'),
  ('text', 'audience_title', 'Für wen?'),
  ('text', 'audience_description', 'CFOs, Finance Manager und alle, die Finanzprozesse transformieren wollen'),
  ('text', 'topics_title', 'Themen'),
  ('text', 'topics_description', 'Digitalisierung, Automatisierung, Prozessoptimierung, Technologie-Trends'),
  ('text', 'badge_1', 'Podcast'),
  ('text', 'badge_2', 'Wöchentlich'),
  ('text', 'badge_3', '30-45 Min'),
  ('text', 'cta_text', 'WTF?! Episoden ansehen'),
  ('text', 'cta_link', '/episodes')
) AS content(content_type, content_key, content_value)
WHERE s.section_key = 'wtf_explanation' AND s.page_type = 'overview';

-- Insert detailed content for CFO Memo section
INSERT INTO public.section_content (section_id, content_type, content_key, content_value) 
SELECT s.id, content_type, content_key, content_value FROM public.main_page_sections s,
(VALUES 
  ('text', 'format_title', 'Format'),
  ('text', 'format_description', 'Strukturierte PDF-Dokumente mit konkreten Handlungsempfehlungen'),
  ('text', 'audience_title', 'Zielgruppe'),
  ('text', 'audience_description', 'Führungskräfte im Finance-Bereich, die schnelle Lösungen brauchen'),
  ('text', 'benefit_title', 'Nutzen'),
  ('text', 'benefit_description', 'Sofort umsetzbare Strategien und Best Practices für deinen Arbeitsalltag'),
  ('text', 'badge_1', 'PDF Download'),
  ('text', 'badge_2', 'Praxisnah'),
  ('text', 'badge_3', '5-10 Seiten'),
  ('text', 'cta_text', 'CFO Memos entdecken'),
  ('text', 'cta_link', '/episodes?tab=memos')
) AS content(content_type, content_key, content_value)
WHERE s.section_key = 'cfo_memo_explanation' AND s.page_type = 'overview';

-- Insert detailed content for Tool Time section
INSERT INTO public.section_content (section_id, content_type, content_key, content_value) 
SELECT s.id, content_type, content_key, content_value FROM public.main_page_sections s,
(VALUES 
  ('text', 'focus_title', 'Fokus'),
  ('text', 'focus_description', 'Detaillierte Tool-Reviews, Implementierungsstrategien und Tech-Trends'),
  ('text', 'audience_title', 'Für Techies'),
  ('text', 'audience_description', 'Finance-Experten mit technischem Background und Tool-Interesse'),
  ('text', 'topics_title', 'Typische Themen:'),
  ('text', 'topic_1', 'ERP-Systeme und ihre Finance-Module'),
  ('text', 'topic_2', 'Business Intelligence und Reporting-Tools'),
  ('text', 'topic_3', 'Automatisierungsplattformen (RPA, Workflows)'),
  ('text', 'topic_4', 'Cloud-Finance-Lösungen und APIs'),
  ('text', 'topic_5', 'KI und Machine Learning im Finance-Bereich'),
  ('text', 'badge_1', 'Deep Dive'),
  ('text', 'badge_2', 'Tool-Focus'),
  ('text', 'badge_3', '45-60 Min'),
  ('text', 'badge_4', 'Hands-on'),
  ('text', 'cta_text', 'Tool Time Episoden ansehen'),
  ('text', 'cta_link', '/episodes')
) AS content(content_type, content_key, content_value)
WHERE s.section_key = 'tool_time_explanation' AND s.page_type = 'overview';

-- Insert CTA section content
INSERT INTO public.section_content (section_id, content_type, content_key, content_value) 
SELECT s.id, content_type, content_key, content_value FROM public.main_page_sections s,
(VALUES 
  ('text', 'primary_cta_text', 'Alle Inhalte entdecken'),
  ('text', 'primary_cta_link', '/episodes'),
  ('text', 'secondary_cta_text', 'Mehr über uns erfahren'),
  ('text', 'secondary_cta_link', '/')
) AS content(content_type, content_key, content_value)
WHERE s.section_key = 'cta_section' AND s.page_type = 'overview';

-- Create function to get overview page sections (similar to main page)
CREATE OR REPLACE FUNCTION get_overview_page_sections()
RETURNS TABLE (
  id UUID,
  section_key TEXT,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  background_color TEXT,
  text_color TEXT,
  section_type TEXT,
  sort_order INTEGER,
  content JSONB,
  links JSONB
) LANGUAGE SQL STABLE AS $$
  SELECT 
    s.id,
    s.section_key,
    s.title,
    s.subtitle,
    s.description,
    s.background_color,
    s.text_color,
    s.section_type,
    s.sort_order,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'content_type', c.content_type,
          'content_key', c.content_key,
          'content_value', c.content_value,
          'metadata', c.metadata
        )
      ) FILTER (WHERE c.id IS NOT NULL), 
      '[]'::jsonb
    ) as content,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'link_type', l.link_type,
          'platform_name', l.platform_name,
          'url', l.url,
          'display_text', l.display_text,
          'color', l.color,
          'icon', l.icon,
          'sort_order', l.sort_order
        )
      ) FILTER (WHERE l.id IS NOT NULL), 
      '[]'::jsonb
    ) as links
  FROM public.main_page_sections s
  LEFT JOIN public.section_content c ON s.id = c.section_id
  LEFT JOIN public.section_links l ON s.id = l.section_id
  WHERE s.page_type = 'overview' AND s.is_active = true
  GROUP BY s.id, s.section_key, s.title, s.subtitle, s.description, s.background_color, s.text_color, s.section_type, s.sort_order
  ORDER BY s.sort_order;
$$;