import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { PDF } from '@/hooks/usePdfs';

interface CreatePDFData {
  title: string;
  description?: string;
  category: string;
  file_url: string;
  file_size?: number;
}

interface UpdatePDFData {
  title?: string;
  description?: string;
  category?: string;
  status?: 'active' | 'archived';
}

export const useAdminPdfs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all PDFs (admin can see all including archived)
  const {
    data: pdfs = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['admin-pdfs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('downloadable_pdfs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PDF[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create PDF mutation
  const createPdfMutation = useMutation({
    mutationFn: async (pdfData: CreatePDFData) => {
      const { data, error } = await supabase
        .from('downloadable_pdfs')
        .insert([pdfData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pdfs'] });
      toast({
        title: 'PDF Created',
        description: 'PDF has been uploaded successfully',
      });
    },
    onError: (error) => {
      console.error('Error creating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to create PDF',
        variant: 'destructive',
      });
    },
  });

  // Update PDF mutation
  const updatePdfMutation = useMutation({
    mutationFn: async ({ id, updateData }: { id: string; updateData: UpdatePDFData }) => {
      const { data, error } = await supabase
        .from('downloadable_pdfs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pdfs'] });
      toast({
        title: 'PDF Updated',
        description: 'PDF has been updated successfully',
      });
    },
    onError: (error) => {
      console.error('Error updating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to update PDF',
        variant: 'destructive',
      });
    },
  });

  // Delete PDF mutation (soft delete - archive)
  const archivePdfMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('downloadable_pdfs')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pdfs'] });
      toast({
        title: 'PDF Archived',
        description: 'PDF has been archived successfully',
      });
    },
    onError: (error) => {
      console.error('Error archiving PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive PDF',
        variant: 'destructive',
      });
    },
  });

  // Hard delete PDF mutation (removes from storage and database)
  const deletePdfMutation = useMutation({
    mutationFn: async (pdf: PDF) => {
      // Extract file path from URL
      const url = new URL(pdf.file_url);
      const filePath = url.pathname.split('/object/public/pdf-downloads/')[1];
      
      if (filePath) {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('pdf-downloads')
          .remove([filePath]);
        
        if (storageError) {
          console.error('Storage deletion error:', storageError);
          // Continue with DB deletion even if storage fails
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('downloadable_pdfs')
        .delete()
        .eq('id', pdf.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pdfs'] });
      toast({
        title: 'PDF Deleted',
        description: 'PDF has been permanently deleted',
      });
    },
    onError: (error) => {
      console.error('Error deleting PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete PDF',
        variant: 'destructive',
      });
    },
  });

  // Filter PDFs based on search and filters
  const filteredPdfs = pdfs.filter(pdf => {
    const matchesSearch = pdf.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (pdf.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesCategory = categoryFilter === 'all' || (pdf.category || 'general') === categoryFilter;
    const matchesStatus = statusFilter === 'all' || (pdf.status || 'active') === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories for filter dropdown
  const categories = [...new Set(pdfs.map(pdf => pdf.category || 'general').filter(Boolean))];

  return {
    pdfs: filteredPdfs,
    isLoading,
    error,
    refetch,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    categories,
    createPdf: createPdfMutation.mutate,
    updatePdf: updatePdfMutation.mutate,
    archivePdf: archivePdfMutation.mutate,
    deletePdf: deletePdfMutation.mutate,
    isCreating: createPdfMutation.isPending,
    isUpdating: updatePdfMutation.isPending,
    isArchiving: archivePdfMutation.isPending,
    isDeleting: deletePdfMutation.isPending,
  };
};