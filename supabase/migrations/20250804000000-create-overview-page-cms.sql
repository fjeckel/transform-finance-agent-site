-- Create Overview page CMS management tables

-- Overview page sections table
CREATE TABLE public.overview_page_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#000000',
  gradient_from TEXT,
  gradient_to TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  section_type TEXT NOT NULL DEFAULT 'info_card',
  layout_config JSONB DEFAULT '{}', -- For layout-specific configurations
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Overview section content table for flexible content management
CREATE TABLE public.overview_section_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.overview_page_sections(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'text', 'html', 'image', 'icon', 'badge', 'list'
  content_key TEXT NOT NULL, -- 'mission_text', 'features_list', 'hero_image', etc.
  content_value TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- For storing structured data like lists, badges, etc.
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(section_id, content_key)
);

-- Overview section links for buttons, navigation, external links
CREATE TABLE public.overview_section_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.overview_page_sections(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL, -- 'button', 'navigation', 'external', 'download'
  link_text TEXT NOT NULL,
  url TEXT NOT NULL,
  button_variant TEXT DEFAULT 'default', -- 'default', 'outline', 'ghost', 'destructive'
  button_size TEXT DEFAULT 'default', -- 'sm', 'default', 'lg'
  icon TEXT, -- lucide icon name
  color TEXT DEFAULT '#000000',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.overview_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overview_section_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overview_section_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for overview_page_sections
CREATE POLICY "Anyone can view active overview sections" 
ON public.overview_page_sections 
FOR SELECT 
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage overview sections" 
ON public.overview_page_sections 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for overview_section_content
CREATE POLICY "Anyone can view content for active overview sections" 
ON public.overview_section_content 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.overview_page_sections 
  WHERE id = overview_section_content.section_id 
  AND (is_active = true OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Admins can manage overview section content" 
ON public.overview_section_content 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for overview_section_links
CREATE POLICY "Anyone can view links for active overview sections" 
ON public.overview_section_links 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.overview_page_sections 
  WHERE id = overview_section_links.section_id 
  AND (is_active = true OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Admins can manage overview section links" 
ON public.overview_section_links 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_overview_page_sections_updated_at
BEFORE UPDATE ON public.overview_page_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_overview_section_content_updated_at
BEFORE UPDATE ON public.overview_section_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_overview_section_links_updated_at
BEFORE UPDATE ON public.overview_section_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial overview page sections based on existing static content
INSERT INTO public.overview_page_sections (
  section_key, 
  title, 
  subtitle, 
  description, 
  section_type, 
  sort_order,
  background_color,
  gradient_from,
  gradient_to,
  layout_config
) VALUES
-- Hero Section
('hero', 
 'Die Welt der Finance Transformers', 
 NULL, 
 'Willkommen in unserem Universum der Finanztransformation. Hier findest du alles, was du über unsere verschiedenen Formate und Inhalte wissen musst.', 
 'hero', 
 1,
 '#ffffff',
 NULL,
 NULL,
 '{"text_align": "center", "max_width": "3xl"}'
),

-- WTF Section
('wtf_info', 
 'Was ist WTF?!', 
 'WTF?! - Warum Finance Transformieren', 
 'Unser Hauptpodcast, der sich den großen Fragen der Finanztransformation widmet.', 
 'info_card', 
 2,
 '#ffffff',
 '#13B87B',
 '#0F9A6A',
 '{"card_style": "gradient_header", "icon": "info"}'
),

-- CFO Memo Section  
('cfo_memo_info', 
 'Was ist CFO Memo?', 
 'CFO Memos', 
 'Kompakte, praxisorientierte Dokumente, die komplexe Finanzthemen auf den Punkt bringen.', 
 'info_card', 
 3,
 '#ffffff',
 '#003FA5',
 '#0056E0',
 '{"card_style": "gradient_header", "icon": "file-text"}'
),

-- Tool Time Section
('tool_time_info', 
 'Was ist Tool Time by WTF?!', 
 'Deep Dives in die Tools und Technologien der Finanztransformation', 
 'Unser Spezialformat für alle, die tief in die technische Seite der Finanztransformation eintauchen wollen.', 
 'tool_time_card', 
 4,
 '#ffffff',
 '#9333ea',
 '#7c3aed',
 '{"card_style": "large_card", "icon": "wrench"}'
),

-- CTA Section
('cta', 
 'Bereit für deine Finance Transformation?', 
 NULL, 
 'Egal ob du gerade erst anfängst oder schon mittendrin bist - bei uns findest du die passenden Inhalte für jeden Schritt deiner Reise.', 
 'cta', 
 5,
 'linear-gradient(to right, #13B87B10, #003FA510)',
 '#13B87B',
 '#003FA5',
 '{"text_align": "center", "padding": "large"}'
);

-- Insert content for WTF info section
INSERT INTO public.overview_section_content (section_id, content_type, content_key, content_value, metadata, sort_order)
SELECT s.id, content_type, content_key, content_value, metadata::jsonb, sort_order 
FROM public.overview_page_sections s,
(VALUES 
  ('text', 'mission_title', 'Mission', NULL, 1),
  ('text', 'mission_text', 'Wir hinterfragen bestehende Finanzprozesse und zeigen neue Wege auf', NULL, 2),
  ('text', 'audience_title', 'Für wen?', NULL, 3),
  ('text', 'audience_text', 'CFOs, Finance Manager und alle, die Finanzprozesse transformieren wollen', NULL, 4),
  ('text', 'topics_title', 'Themen', NULL, 5),
  ('text', 'topics_text', 'Digitalisierung, Automatisierung, Prozessoptimierung, Technologie-Trends', NULL, 6),
  ('list', 'badges', '["Podcast", "Wöchentlich", "30-45 Min"]', '{"type": "secondary"}', 7)
) AS content(content_type, content_key, content_value, metadata, sort_order)
WHERE s.section_key = 'wtf_info';

-- Insert content for CFO Memo section
INSERT INTO public.overview_section_content (section_id, content_type, content_key, content_value, metadata, sort_order)
SELECT s.id, content_type, content_key, content_value, metadata::jsonb, sort_order 
FROM public.overview_page_sections s,
(VALUES 
  ('text', 'format_title', 'Format', NULL, 1),
  ('text', 'format_text', 'Strukturierte PDF-Dokumente mit konkreten Handlungsempfehlungen', NULL, 2),
  ('text', 'audience_title', 'Zielgruppe', NULL, 3),
  ('text', 'audience_text', 'Führungskräfte im Finance-Bereich, die schnelle Lösungen brauchen', NULL, 4),
  ('text', 'benefit_title', 'Nutzen', NULL, 5),
  ('text', 'benefit_text', 'Sofort umsetzbare Strategien und Best Practices für deinen Arbeitsalltag', NULL, 6),
  ('list', 'badges', '["PDF Download", "Praxisnah", "5-10 Seiten"]', '{"type": "secondary"}', 7)
) AS content(content_type, content_key, content_value, metadata, sort_order)
WHERE s.section_key = 'cfo_memo_info';

-- Insert content for Tool Time section
INSERT INTO public.overview_section_content (section_id, content_type, content_key, content_value, metadata, sort_order)
SELECT s.id, content_type, content_key, content_value, metadata::jsonb, sort_order 
FROM public.overview_page_sections s,
(VALUES 
  ('text', 'focus_title', 'Fokus', NULL, 1),
  ('text', 'focus_text', 'Detaillierte Tool-Reviews, Implementierungsstrategien und Tech-Trends', NULL, 2),
  ('text', 'audience_title', 'Für Techies', NULL, 3),
  ('text', 'audience_text', 'Finance-Experten mit technischem Background und Tool-Interesse', NULL, 4),
  ('text', 'topics_title', 'Typische Themen:', NULL, 5),
  ('list', 'topic_list', '["ERP-Systeme und ihre Finance-Module", "Business Intelligence und Reporting-Tools", "Automatisierungsplattformen (RPA, Workflows)", "Cloud-Finance-Lösungen und APIs", "KI und Machine Learning im Finance-Bereich"]', '{"type": "bullet_points"}', 6),
  ('list', 'badges', '["Deep Dive", "Tool-Focus", "45-60 Min", "Hands-on"]', '{"type": "secondary"}', 7)
) AS content(content_type, content_key, content_value, metadata, sort_order)
WHERE s.section_key = 'tool_time_info';

-- Insert links for WTF section
INSERT INTO public.overview_section_links (section_id, link_type, link_text, url, button_variant, button_size, sort_order)
SELECT s.id, 'button', 'WTF?! Episoden ansehen', '/episodes', 'default', 'default', 1
FROM public.overview_page_sections s
WHERE s.section_key = 'wtf_info';

-- Insert links for CFO Memo section
INSERT INTO public.overview_section_links (section_id, link_type, link_text, url, button_variant, button_size, sort_order)
SELECT s.id, 'button', 'CFO Memos entdecken', '/episodes?tab=memos', 'outline', 'default', 1
FROM public.overview_page_sections s
WHERE s.section_key = 'cfo_memo_info';

-- Insert links for Tool Time section
INSERT INTO public.overview_section_links (section_id, link_type, link_text, url, button_variant, button_size, sort_order)
SELECT s.id, 'button', 'Tool Time Episoden ansehen', '/episodes', 'outline', 'default', 1
FROM public.overview_page_sections s
WHERE s.section_key = 'tool_time_info';

-- Insert links for CTA section
INSERT INTO public.overview_section_links (section_id, link_type, link_text, url, button_variant, button_size, sort_order)
SELECT s.id, link_type, link_text, url, button_variant, button_size, sort_order
FROM public.overview_page_sections s,
(VALUES 
  ('button', 'Alle Inhalte entdecken', '/episodes', 'default', 'lg', 1),
  ('button', 'Mehr über uns erfahren', '/', 'outline', 'lg', 2)
) AS links(link_type, link_text, url, button_variant, button_size, sort_order)
WHERE s.section_key = 'cta';