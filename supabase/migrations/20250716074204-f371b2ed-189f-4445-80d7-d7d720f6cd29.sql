-- Add image_url column to downloadable_pdfs table for PDF cover art
ALTER TABLE public.downloadable_pdfs 
ADD COLUMN image_url TEXT;