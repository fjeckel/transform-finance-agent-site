-- Add page_type column to main_page_sections table and insert overview content
-- This fixes the empty Überblick/Overview tab

-- Add page_type column
ALTER TABLE public.main_page_sections 
ADD COLUMN page_type TEXT DEFAULT 'home';

-- Update existing sections to be 'home' page type
UPDATE public.main_page_sections 
SET page_type = 'home' 
WHERE page_type IS NULL;

-- Insert overview page sections
INSERT INTO public.main_page_sections (
  section_key, 
  title, 
  subtitle, 
  description, 
  section_type, 
  sort_order,
  background_color,
  text_color,
  page_type,
  is_active
) VALUES
-- Hero Section
('overview_hero', 
 'Die Welt der Finance Transformers', 
 NULL, 
 'Willkommen in unserem Universum der Finanztransformation. Hier findest du alles, was du über unsere verschiedenen Formate und Inhalte wissen musst.', 
 'hero', 
 1,
 '#ffffff',
 '#000000',
 'overview',
 true
),

-- WTF Section
('overview_wtf_info', 
 'Was ist WTF?!', 
 'WTF?! - Warum Finance Transformieren', 
 'Unser Hauptpodcast, der sich den großen Fragen der Finanztransformation widmet.', 
 'info_card', 
 2,
 '#ffffff',
 '#000000',
 'overview',
 true
),

-- CFO Memo Section  
('overview_cfo_memo_info', 
 'Was ist CFO Memo?', 
 'CFO Memos', 
 'Kompakte, praxisorientierte Dokumente, die komplexe Finanzthemen auf den Punkt bringen.', 
 'info_card', 
 3,
 '#ffffff',
 '#000000',
 'overview',
 true
),

-- Tool Time Section
('overview_tool_time_info', 
 'Was ist Tool Time by WTF?!', 
 'Deep Dives in die Tools und Technologien der Finanztransformation', 
 'Unser Spezialformat für alle, die tief in die technische Seite der Finanztransformation eintauchen wollen.', 
 'tool_time_card', 
 4,
 '#ffffff',
 '#000000',
 'overview',
 true
),

-- Service Cards for episodes and insights
('overview_episodes_service', 
 'Episoden & Podcasts', 
 'Höre unsere Podcast-Folgen', 
 'Entdecke alle unsere Podcast-Episoden zu Finance Transformation, Tools und Best Practices.', 
 'service_card', 
 5,
 '#13B87B',
 '#ffffff',
 'overview',
 true
),

('overview_insights_service', 
 'Insights & CFO Memos', 
 'Lies unsere Insights', 
 'Tiefgehende Analysen, CFO Memos und praktische Insights für Finance Professionals.', 
 'service_card', 
 6,
 '#003FA5',
 '#ffffff',
 'overview',
 true
),

-- CTA Section
('overview_cta', 
 'Bereit für deine Finance Transformation?', 
 NULL, 
 'Egal ob du gerade erst anfängst oder schon mittendrin bist - bei uns findest du die passenden Inhalte für jeden Schritt deiner Reise.', 
 'cta', 
 7,
 '#f8f9fa',
 '#000000',
 'overview',
 true
);

-- Insert content for WTF info section
INSERT INTO public.section_content (section_id, content_type, content_key, content_value, metadata)
SELECT s.id, content.content_type, content.content_key, content.content_value, content.metadata::jsonb
FROM public.main_page_sections s,
(VALUES 
  ('text', 'mission_title', 'Mission', '{}'),
  ('text', 'mission_text', 'Wir hinterfragen bestehende Finanzprozesse und zeigen neue Wege auf', '{}'),
  ('text', 'audience_title', 'Für wen?', '{}'),
  ('text', 'audience_text', 'CFOs, Finance Manager und alle, die Finanzprozesse transformieren wollen', '{}'),
  ('text', 'topics_title', 'Themen', '{}'),
  ('text', 'topics_text', 'Digitalisierung, Automatisierung, Prozessoptimierung, Technologie-Trends', '{}')
) AS content(content_type, content_key, content_value, metadata)
WHERE s.section_key = 'overview_wtf_info';

-- Insert content for CFO Memo section
INSERT INTO public.section_content (section_id, content_type, content_key, content_value, metadata)
SELECT s.id, content.content_type, content.content_key, content.content_value, content.metadata::jsonb
FROM public.main_page_sections s,
(VALUES 
  ('text', 'format_title', 'Format', '{}'),
  ('text', 'format_text', 'Strukturierte PDF-Dokumente mit konkreten Handlungsempfehlungen', '{}'),
  ('text', 'audience_title', 'Zielgruppe', '{}'),
  ('text', 'audience_text', 'Führungskräfte im Finance-Bereich, die schnelle Lösungen brauchen', '{}'),
  ('text', 'benefit_title', 'Nutzen', '{}'),
  ('text', 'benefit_text', 'Sofort umsetzbare Strategien und Best Practices für deinen Arbeitsalltag', '{}')
) AS content(content_type, content_key, content_value, metadata)
WHERE s.section_key = 'overview_cfo_memo_info';

-- Insert content for Tool Time section
INSERT INTO public.section_content (section_id, content_type, content_key, content_value, metadata)
SELECT s.id, content.content_type, content.content_key, content.content_value, content.metadata::jsonb
FROM public.main_page_sections s,
(VALUES 
  ('text', 'focus_title', 'Fokus', '{}'),
  ('text', 'focus_text', 'Detaillierte Tool-Reviews, Implementierungsstrategien und Tech-Trends', '{}'),
  ('text', 'audience_title', 'Für Techies', '{}'),
  ('text', 'audience_text', 'Finance-Experten mit technischem Background und Tool-Interesse', '{}'),
  ('text', 'topics_title', 'Typische Themen:', '{}')
) AS content(content_type, content_key, content_value, metadata)
WHERE s.section_key = 'overview_tool_time_info';

-- Insert links for WTF section
INSERT INTO public.section_links (section_id, link_type, platform_name, url, display_text, sort_order)
SELECT s.id, 'button', 'WTF?! Episoden', '/episodes', 'WTF?! Episoden ansehen', 1
FROM public.main_page_sections s
WHERE s.section_key = 'overview_wtf_info';

-- Insert links for CFO Memo section
INSERT INTO public.section_links (section_id, link_type, platform_name, url, display_text, sort_order)
SELECT s.id, 'button', 'CFO Memos', '/episodes?tab=memos', 'CFO Memos entdecken', 1
FROM public.main_page_sections s
WHERE s.section_key = 'overview_cfo_memo_info';

-- Insert links for Tool Time section
INSERT INTO public.section_links (section_id, link_type, platform_name, url, display_text, sort_order)
SELECT s.id, 'button', 'Tool Time', '/episodes', 'Tool Time Episoden ansehen', 1
FROM public.main_page_sections s
WHERE s.section_key = 'overview_tool_time_info';

-- Insert links for Episodes service card
INSERT INTO public.section_links (section_id, link_type, platform_name, url, display_text, sort_order)
SELECT s.id, 'button', 'Episoden', '/episodes', 'Alle Episoden ansehen', 1
FROM public.main_page_sections s
WHERE s.section_key = 'overview_episodes_service';

-- Insert links for Insights service card
INSERT INTO public.section_links (section_id, link_type, platform_name, url, display_text, sort_order)
SELECT s.id, 'button', 'Insights', '/insights', 'Alle Insights lesen', 1
FROM public.main_page_sections s
WHERE s.section_key = 'overview_insights_service';

-- Insert links for CTA section
INSERT INTO public.section_links (section_id, link_type, platform_name, url, display_text, sort_order)
SELECT s.id, links.link_type, links.platform_name, links.url, links.display_text, links.sort_order
FROM public.main_page_sections s,
(VALUES 
  ('button', 'Alle Inhalte', '/episodes', 'Alle Inhalte entdecken', 1),
  ('button', 'Mehr über uns', '/', 'Mehr über uns erfahren', 2)
) AS links(link_type, platform_name, url, display_text, sort_order)
WHERE s.section_key = 'overview_cta';