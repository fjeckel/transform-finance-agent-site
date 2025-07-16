-- Create main page sections management tables

-- Main sections table
CREATE TABLE public.main_page_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#000000',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  section_type TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Section content table for flexible content management
CREATE TABLE public.section_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.main_page_sections(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'image', 'text', 'html', 'avatar'
  content_key TEXT NOT NULL, -- 'cover_image', 'description', 'bio', etc.
  content_value TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(section_id, content_key)
);

-- Section links for platforms, social media, etc.
CREATE TABLE public.section_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.main_page_sections(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL, -- 'podcast', 'social', 'website', 'email'
  platform_name TEXT NOT NULL,
  url TEXT NOT NULL,
  display_text TEXT,
  color TEXT DEFAULT '#000000',
  icon TEXT, -- lucide icon name
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Section configurations for layout and styling
CREATE TABLE public.section_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.main_page_sections(id) ON DELETE CASCADE,
  config_key TEXT NOT NULL,
  config_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(section_id, config_key)
);

-- Enable RLS
ALTER TABLE public.main_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for main_page_sections
CREATE POLICY "Anyone can view active sections" 
ON public.main_page_sections 
FOR SELECT 
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage sections" 
ON public.main_page_sections 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for section_content
CREATE POLICY "Anyone can view content for active sections" 
ON public.section_content 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.main_page_sections 
  WHERE id = section_content.section_id 
  AND (is_active = true OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Admins can manage section content" 
ON public.section_content 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for section_links
CREATE POLICY "Anyone can view links for active sections" 
ON public.section_links 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.main_page_sections 
  WHERE id = section_links.section_id 
  AND (is_active = true OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Admins can manage section links" 
ON public.section_links 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for section_configurations
CREATE POLICY "Anyone can view configs for active sections" 
ON public.section_configurations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.main_page_sections 
  WHERE id = section_configurations.section_id 
  AND (is_active = true OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Admins can manage section configs" 
ON public.section_configurations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_main_page_sections_updated_at
BEFORE UPDATE ON public.main_page_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_section_content_updated_at
BEFORE UPDATE ON public.section_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_section_links_updated_at
BEFORE UPDATE ON public.section_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_section_configurations_updated_at
BEFORE UPDATE ON public.section_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data for existing sections
INSERT INTO public.main_page_sections (section_key, title, subtitle, description, section_type, sort_order) VALUES
('wtf', 'WTF?! WARUM FINANCE TRANSFORMIEREN', 'Der Podcast für Finance Transformation', 'In unserem Podcast sprechen wir über die Herausforderungen und Chancen der Finance Transformation. Wir teilen Erfahrungen, Best Practices und geben praktische Tipps für Finance-Profis.', 'podcast', 1),
('finance_transformers', 'Finance Transformers', 'Die Experten-Serie', 'Gespräche mit führenden Experten der Finance Transformation über aktuelle Trends, Technologien und Strategien.', 'episode_carousel', 2),
('tim_teuscher', 'Tim Teuscher', 'Finance Transformation Expert', 'Tim ist ein erfahrener Finance Transformation Berater und hilft Unternehmen dabei, ihre Finanzprozesse zu digitalisieren und zu optimieren.', 'person_profile', 3),
('fabian_jeckel', 'Fabian Jeckel', 'CFO & Finance Leader', 'Fabian bringt jahrelange Erfahrung als CFO und Finance Leader mit und teilt seine Insights zur modernen Finanzführung.', 'person_profile', 4),
('social_handles', 'Stay Connected', 'Folge uns auf Social Media', 'Bleibe auf dem Laufenden mit den neuesten Insights und Updates zur Finance Transformation.', 'social_links', 5);

-- Insert content for WTF section
INSERT INTO public.section_content (section_id, content_type, content_key, content_value) 
SELECT id, 'image', 'cover_image', '/img/wtf-cover.png' FROM public.main_page_sections WHERE section_key = 'wtf';

-- Insert podcast links for WTF section
INSERT INTO public.section_links (section_id, link_type, platform_name, url, color, sort_order)
SELECT s.id, 'podcast', platform, url, color, sort_order FROM public.main_page_sections s,
(VALUES 
  ('Spotify', 'https://open.spotify.com/show/your-show-id', '#1db954', 1),
  ('Apple Podcasts', 'https://podcasts.apple.com/podcast/your-podcast-id', '#fa243c', 2),
  ('Google Podcasts', 'https://podcasts.google.com/feed/your-feed-url', '#4285f4', 3),
  ('YouTube', 'https://youtube.com/@your-channel', '#ff0000', 4),
  ('RSS Feed', 'https://your-rss-feed.xml', '#ff6600', 5)
) AS links(platform, url, color, sort_order)
WHERE s.section_key = 'wtf';

-- Insert content for Tim Teuscher section
INSERT INTO public.section_content (section_id, content_type, content_key, content_value) 
SELECT s.id, content_type, content_key, content_value FROM public.main_page_sections s,
(VALUES 
  ('image', 'avatar_image', '/img/tim-teuscher.jpg'),
  ('text', 'bio', 'Als erfahrener Finance Transformation Berater unterstütze ich Unternehmen dabei, ihre Finanzprozesse zu modernisieren und effizienter zu gestalten. Meine Expertise liegt in der Digitalisierung von Finance-Abläufen und der Implementierung zukunftsfähiger Lösungen.')
) AS content(content_type, content_key, content_value)
WHERE s.section_key = 'tim_teuscher';

-- Insert links for Tim Teuscher section
INSERT INTO public.section_links (section_id, link_type, platform_name, url, display_text, icon, sort_order)
SELECT s.id, link_type, platform_name, url, display_text, icon, sort_order FROM public.main_page_sections s,
(VALUES 
  ('website', 'Website', 'https://tim-teuscher.com', 'Besuche meine Website', 'external-link', 1),
  ('social', 'LinkedIn', 'https://linkedin.com/in/tim-teuscher', 'LinkedIn Profil', 'linkedin', 2)
) AS links(link_type, platform_name, url, display_text, icon, sort_order)
WHERE s.section_key = 'tim_teuscher';

-- Insert content for Fabian Jeckel section
INSERT INTO public.section_content (section_id, content_type, content_key, content_value) 
SELECT s.id, content_type, content_key, content_value FROM public.main_page_sections s,
(VALUES 
  ('image', 'avatar_image', '/img/fabian-jeckel.jpg'),
  ('text', 'role', 'CFO & Finance Transformation Expert'),
  ('text', 'bio', 'Mit langjähriger Erfahrung als CFO bringe ich praktische Insights zur Finance Transformation mit. Ich helfe dabei, moderne Finanzprozesse zu etablieren und Teams für die Zukunft aufzustellen.')
) AS content(content_type, content_key, content_value)
WHERE s.section_key = 'fabian_jeckel';

-- Insert links for Fabian Jeckel section
INSERT INTO public.section_links (section_id, link_type, platform_name, url, display_text, icon, sort_order)
SELECT s.id, link_type, platform_name, url, display_text, icon, sort_order FROM public.main_page_sections s,
(VALUES 
  ('social', 'LinkedIn', 'https://linkedin.com/in/fabian-jeckel', 'LinkedIn Profil', 'linkedin', 1),
  ('email', 'Email', 'mailto:fabian@example.com', 'E-Mail senden', 'mail', 2)
) AS links(link_type, platform_name, url, display_text, icon, sort_order)
WHERE s.section_key = 'fabian_jeckel';

-- Insert social media links for social handles section
INSERT INTO public.section_links (section_id, link_type, platform_name, url, display_text, color, icon, sort_order)
SELECT s.id, link_type, platform_name, url, display_text, color, icon, sort_order FROM public.main_page_sections s,
(VALUES 
  ('social', 'LinkedIn', 'https://linkedin.com/company/finance-transformation', 'Folge uns auf LinkedIn für professionelle Insights und Networking', '#0077b5', 'linkedin', 1),
  ('social', 'YouTube', 'https://youtube.com/@financetransformation', 'Abonniere unseren YouTube-Kanal für Video-Content und Tutorials', '#ff0000', 'youtube', 2)
) AS links(link_type, platform_name, url, display_text, color, icon, sort_order)
WHERE s.section_key = 'social_handles';