-- Create function to increment PDF download count
CREATE OR REPLACE FUNCTION public.increment_download_count(pdf_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.downloadable_pdfs 
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE id = pdf_id;
END;
$$;