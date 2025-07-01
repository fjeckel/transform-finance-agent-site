
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'member', 'guest');

-- Create enum for episode status
CREATE TYPE public.episode_status AS ENUM ('draft', 'published', 'archived', 'scheduled');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'guest',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create episodes table
CREATE TABLE public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  season INTEGER DEFAULT 1,
  episode_number INTEGER NOT NULL,
  duration TEXT,
  publish_date TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  audio_url TEXT,
  transcript TEXT,
  status episode_status DEFAULT 'draft',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(season, episode_number)
);

-- Create show_notes table for timestamped notes
CREATE TABLE public.show_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE NOT NULL,
  timestamp TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create episode_platforms table for platform links
CREATE TABLE public.episode_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE NOT NULL,
  platform_name TEXT NOT NULL,
  platform_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(episode_id, platform_name)
);

-- Create guests table
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create episode_guests junction table
CREATE TABLE public.episode_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(episode_id, guest_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.show_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_guests ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  
  -- Assign default guest role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'guest');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all user roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for episodes
CREATE POLICY "Anyone can view published episodes" ON public.episodes
  FOR SELECT USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all episodes" ON public.episodes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for show_notes
CREATE POLICY "Anyone can view show notes for published episodes" ON public.show_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.episodes
      WHERE episodes.id = show_notes.episode_id
      AND (episodes.status = 'published' OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Admins can manage show notes" ON public.show_notes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for episode_platforms
CREATE POLICY "Anyone can view platform links for published episodes" ON public.episode_platforms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.episodes
      WHERE episodes.id = episode_platforms.episode_id
      AND (episodes.status = 'published' OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Admins can manage platform links" ON public.episode_platforms
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for guests
CREATE POLICY "Anyone can view guests" ON public.guests
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Admins can manage guests" ON public.guests
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for episode_guests
CREATE POLICY "Anyone can view episode guests" ON public.episode_guests
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Admins can manage episode guests" ON public.episode_guests
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public) VALUES ('episode-media', 'episode-media', true);

-- Create storage policies
CREATE POLICY "Anyone can view episode media" ON storage.objects
  FOR SELECT USING (bucket_id = 'episode-media');

CREATE POLICY "Admins can upload episode media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'episode-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update episode media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'episode-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete episode media" ON storage.objects
  FOR DELETE USING (bucket_id = 'episode-media' AND public.has_role(auth.uid(), 'admin'));
