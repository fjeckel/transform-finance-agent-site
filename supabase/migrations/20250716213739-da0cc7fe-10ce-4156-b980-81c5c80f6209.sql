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
SELECT s.id, 'podcast', links.platform, links.url, links.color, links.sort_order 
FROM public.main_page_sections s,
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
SELECT s.id, content.content_type, content.content_key, content.content_value 
FROM public.main_page_sections s,
(VALUES 
  ('image', 'avatar_image', '/img/tim-teuscher.jpg'),
  ('text', 'bio', 'Als erfahrener Finance Transformation Berater unterstütze ich Unternehmen dabei, ihre Finanzprozesse zu modernisieren und effizienter zu gestalten. Meine Expertise liegt in der Digitalisierung von Finance-Abläufen und der Implementierung zukunftsfähiger Lösungen.')
) AS content(content_type, content_key, content_value)
WHERE s.section_key = 'tim_teuscher';

-- Insert links for Tim Teuscher section
INSERT INTO public.section_links (section_id, link_type, platform_name, url, display_text, icon, sort_order)
SELECT s.id, links.link_type, links.platform_name, links.url, links.display_text, links.icon, links.sort_order 
FROM public.main_page_sections s,
(VALUES 
  ('website', 'Website', 'https://tim-teuscher.com', 'Besuche meine Website', 'external-link', 1),
  ('social', 'LinkedIn', 'https://linkedin.com/in/tim-teuscher', 'LinkedIn Profil', 'linkedin', 2)
) AS links(link_type, platform_name, url, display_text, icon, sort_order)
WHERE s.section_key = 'tim_teuscher';

-- Insert content for Fabian Jeckel section
INSERT INTO public.section_content (section_id, content_type, content_key, content_value) 
SELECT s.id, content.content_type, content.content_key, content.content_value 
FROM public.main_page_sections s,
(VALUES 
  ('image', 'avatar_image', '/img/fabian-jeckel.jpg'),
  ('text', 'role', 'CFO & Finance Transformation Expert'),
  ('text', 'bio', 'Mit langjähriger Erfahrung als CFO bringe ich praktische Insights zur Finance Transformation mit. Ich helfe dabei, moderne Finanzprozesse zu etablieren und Teams für die Zukunft aufzustellen.')
) AS content(content_type, content_key, content_value)
WHERE s.section_key = 'fabian_jeckel';

-- Insert links for Fabian Jeckel section
INSERT INTO public.section_links (section_id, link_type, platform_name, url, display_text, icon, sort_order)
SELECT s.id, links.link_type, links.platform_name, links.url, links.display_text, links.icon, links.sort_order 
FROM public.main_page_sections s,
(VALUES 
  ('social', 'LinkedIn', 'https://linkedin.com/in/fabian-jeckel', 'LinkedIn Profil', 'linkedin', 1),
  ('email', 'Email', 'mailto:fabian@example.com', 'E-Mail senden', 'mail', 2)
) AS links(link_type, platform_name, url, display_text, icon, sort_order)
WHERE s.section_key = 'fabian_jeckel';

-- Insert social media links for social handles section
INSERT INTO public.section_links (section_id, link_type, platform_name, url, display_text, color, icon, sort_order)
SELECT s.id, links.link_type, links.platform_name, links.url, links.display_text, links.color, links.icon, links.sort_order 
FROM public.main_page_sections s,
(VALUES 
  ('social', 'LinkedIn', 'https://linkedin.com/company/finance-transformation', 'Folge uns auf LinkedIn für professionelle Insights und Networking', '#0077b5', 'linkedin', 1),
  ('social', 'YouTube', 'https://youtube.com/@financetransformation', 'Abonniere unseren YouTube-Kanal für Video-Content und Tutorials', '#ff0000', 'youtube', 2)
) AS links(link_type, platform_name, url, display_text, color, icon, sort_order)
WHERE s.section_key = 'social_handles';