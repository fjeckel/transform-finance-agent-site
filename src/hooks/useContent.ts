import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ContentItem {
  id: string;
  title: string;
  type: 'episode' | 'pdf';
  slug?: string;
  description?: string;
  image_url?: string;
  file_url?: string;
  series?: string;
  publish_date?: string;
  created_at: string;
  status?: string;
  is_public?: boolean;
  download_count?: number;
  file_size?: number;
}

export const useContent = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch episodes
      const { data: episodes, error: episodesError } = await supabase
        .from('episodes')
        .select('*')
        .eq('status', 'published')
        .order('publish_date', { ascending: false });

      if (episodesError) throw episodesError;

      // Fetch PDFs
      const { data: pdfs, error: pdfsError } = await supabase
        .from('downloadable_pdfs')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (pdfsError) throw pdfsError;

      // Transform and combine data
      const episodeItems: ContentItem[] = (episodes || []).map(episode => ({
        id: episode.id,
        title: episode.title,
        type: 'episode' as const,
        slug: episode.slug,
        description: episode.description,
        image_url: episode.image_url,
        series: episode.series,
        publish_date: episode.publish_date,
        created_at: episode.created_at,
        status: episode.status
      }));

      const pdfItems: ContentItem[] = (pdfs || []).map(pdf => ({
        id: pdf.id,
        title: pdf.title,
        type: 'pdf' as const,
        description: pdf.description,
        file_url: pdf.file_url,
        created_at: pdf.created_at,
        is_public: pdf.is_public,
        download_count: pdf.download_count,
        file_size: pdf.file_size
      }));

      // Combine and sort by date
      const allContent = [...episodeItems, ...pdfItems].sort((a, b) => {
        const dateA = new Date(a.publish_date || a.created_at);
        const dateB = new Date(b.publish_date || b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      setContent(allContent);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('Fehler beim Laden der Inhalte');
      toast({
        title: "Fehler",
        description: "Inhalte konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  return {
    content,
    loading,
    error,
    refetch: fetchContent
  };
};