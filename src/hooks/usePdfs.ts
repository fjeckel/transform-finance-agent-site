import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PDF {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  image_url: string | null;
  file_size: number | null;
  download_count: number | null;
  is_public: boolean | null;
  created_at: string | null;
  category?: string | null;
  status?: string | null;
  // New fields for monetization
  price?: number;
  is_premium?: boolean;
  currency?: string;
  stripe_price_id?: string;
}

export const usePdfs = () => {
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPdfs();
  }, []);

  const fetchPdfs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('downloadable_pdfs')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPdfs(data || []);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      setError('Failed to load PDFs');
    } finally {
      setLoading(false);
    }
  };

  const incrementDownloadCount = async (pdfId: string) => {
    try {
      await supabase.rpc('increment_download_count', { pdf_id: pdfId });
      // Update local state
      setPdfs(prev => prev.map(pdf => 
        pdf.id === pdfId 
          ? { ...pdf, download_count: (pdf.download_count || 0) + 1 }
          : pdf
      ));
    } catch (error) {
      console.error('Error incrementing download count:', error);
    }
  };

  return { pdfs, loading, error, refetch: fetchPdfs, incrementDownloadCount };
};