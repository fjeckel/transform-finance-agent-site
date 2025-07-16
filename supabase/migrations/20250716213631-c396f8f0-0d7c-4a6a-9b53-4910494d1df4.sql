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