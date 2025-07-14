-- Create table for downloadable PDFs
CREATE TABLE public.downloadable_pdfs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_size bigint,
  download_count integer DEFAULT 0,
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id)
);

-- Enable Row Level Security
ALTER TABLE public.downloadable_pdfs ENABLE ROW LEVEL SECURITY;

-- Create policies for PDF downloads
CREATE POLICY "Anyone can view public PDFs" 
ON public.downloadable_pdfs 
FOR SELECT 
USING (is_public = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage PDFs" 
ON public.downloadable_pdfs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_downloadable_pdfs_updated_at
BEFORE UPDATE ON public.downloadable_pdfs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for PDFs if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'pdf-downloads', 
  'pdf-downloads', 
  true, 
  52428800, -- 50MB limit
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for PDF uploads
CREATE POLICY "Anyone can view PDF files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pdf-downloads');

CREATE POLICY "Admins can upload PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pdf-downloads' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update PDFs" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pdf-downloads' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete PDFs" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pdf-downloads' AND has_role(auth.uid(), 'admin'::app_role));