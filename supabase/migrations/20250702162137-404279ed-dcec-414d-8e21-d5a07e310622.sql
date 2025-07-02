-- Create page_visit_logs table for analytics
CREATE TABLE IF NOT EXISTS public.page_visit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL,
  visited_at timestamp with time zone DEFAULT now(),
  user_id uuid REFERENCES public.profiles(id)
);

-- Enable Row Level Security
ALTER TABLE public.page_visit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert page visit logs" ON public.page_visit_logs
  FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY "Admins can view page visit logs" ON public.page_visit_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));