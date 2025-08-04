import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { translationService } from '@/services/translationService';
import { toast } from '@/hooks/use-toast';

interface AutoTranslationConfig {
  enabled: boolean;
  supportedLanguages: string[];
  autoTranslateFields: string[];
  qualityThreshold: number;
  costLimitDaily: number;
}

// Hook to manage auto-translation workflow
export const useAutoTranslation = () => {
  const queryClient = useQueryClient();

  // Get auto-translation configuration
  const { data: config } = useQuery({
    queryKey: ['auto-translation-config'],
    queryFn: async () => {
      // In a real implementation, this would fetch from settings/database
      // For now, return default config
      const defaultConfig: AutoTranslationConfig = {
        enabled: false,
        supportedLanguages: ['en', 'fr', 'es'],
        autoTranslateFields: ['title', 'description', 'summary'],
        qualityThreshold: 0.8,
        costLimitDaily: 10.0,
      };
      return defaultConfig;
    },
  });

  // Auto-translation mutation
  const autoTranslateMutation = useMutation({
    mutationFn: async ({ 
      contentId, 
      contentType, 
      languages, 
      fields 
    }: {
      contentId: string;
      contentType: 'insight' | 'episode' | 'category';
      languages: string[];
      fields: string[];
    }) => {
      const results = [];
      
      for (const language of languages) {
        try {
          const result = await translationService.translateContent({
            contentId,
            contentType,
            targetLanguage: language,
            fields,
            priority: 'medium',
          });
          
          results.push({
            language,
            success: result.success,
            cost: result.cost?.totalCostUsd || 0,
            error: result.error,
          });
        } catch (error) {
          results.push({
            language,
            success: false,
            cost: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
      
      if (successful > 0) {
        toast({
          title: 'Auto-Translation Complete',
          description: `Translated to ${successful} languages. Cost: $${totalCost.toFixed(4)}`,
        });
      }
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['translation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['translation-overview'] });
    },
    onError: (error) => {
      toast({
        title: 'Auto-Translation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  // Function to trigger auto-translation for new content
  const triggerAutoTranslation = async (
    contentId: string,
    contentType: 'insight' | 'episode' | 'category'
  ) => {
    if (!config?.enabled) return;

    // Check if content already has translations
    const tableName = `${contentType === 'category' ? 'insights_categories' : contentType + 's'}_translations`;
    const idField = contentType === 'category' ? 'category_id' : contentType + '_id';
    
    const { data: existingTranslations } = await supabase
      .from(tableName)
      .select('language_code')
      .eq(idField, contentId);

    const existingLanguages = existingTranslations?.map(t => t.language_code) || [];
    const languagesToTranslate = config.supportedLanguages.filter(
      lang => !existingLanguages.includes(lang)
    );

    if (languagesToTranslate.length === 0) return;

    // Trigger translation
    autoTranslateMutation.mutate({
      contentId,
      contentType,
      languages: languagesToTranslate,
      fields: config.autoTranslateFields,
    });
  };

  return {
    config,
    isTranslating: autoTranslateMutation.isPending,
    triggerAutoTranslation,
  };
};

// Hook to set up real-time triggers for auto-translation
export const useAutoTranslationTriggers = () => {
  const { triggerAutoTranslation, config } = useAutoTranslation();

  useEffect(() => {
    if (!config?.enabled) return;

    // Set up real-time listeners for new published content
    const insightsChannel = supabase
      .channel('insights-auto-translate')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'insights',
        filter: 'status=eq.published',
      }, (payload) => {
        // Check if status changed to published
        if (payload.old?.status !== 'published' && payload.new?.status === 'published') {
          triggerAutoTranslation(payload.new.id, 'insight');
        }
      })
      .subscribe();

    const episodesChannel = supabase
      .channel('episodes-auto-translate')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'episodes',
        filter: 'status=eq.published',
      }, (payload) => {
        // Check if status changed to published
        if (payload.old?.status !== 'published' && payload.new?.status === 'published') {
          triggerAutoTranslation(payload.new.id, 'episode');
        }
      })
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(insightsChannel);
      supabase.removeChannel(episodesChannel);
    };
  }, [config?.enabled, triggerAutoTranslation]);
};

// Hook for manual batch auto-translation
export const useBatchAutoTranslation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentType,
      targetLanguages,
      fields,
      maxItems = 5,
    }: {
      contentType: 'insight' | 'episode' | 'category';
      targetLanguages: string[];
      fields: string[];
      maxItems?: number;
    }) => {
      const results = [];
      
      for (const language of targetLanguages) {
        const result = await translationService.batchTranslate({
          contentType,
          targetLanguage: language,
          fields,
          maxItems,
          priority: 'low',
        });
        
        results.push({
          language,
          ...result,
        });
      }
      
      return results;
    },
    onSuccess: (results) => {
      const totalProcessed = results.reduce((sum, r) => sum + r.totalProcessed, 0);
      const totalCost = results.reduce((sum, r) => sum + r.totalCostUsd, 0);
      
      toast({
        title: 'Batch Auto-Translation Complete',
        description: `Processed ${totalProcessed} items across ${results.length} languages. Cost: $${totalCost.toFixed(4)}`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['translation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['translation-overview'] });
      queryClient.invalidateQueries({ queryKey: ['translation-queue'] });
    },
    onError: (error) => {
      toast({
        title: 'Batch Auto-Translation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    },
  });
};