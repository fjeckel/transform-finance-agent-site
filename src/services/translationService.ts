import { supabase } from '@/integrations/supabase/client';

export interface TranslationRequest {
  contentId: string;
  contentType: 'insight' | 'episode' | 'category';
  targetLanguage: string;
  fields: string[];
  priority?: 'high' | 'medium' | 'low';
  aiProvider?: 'openai' | 'claude';
}

export interface BatchTranslationRequest {
  contentType: 'insight' | 'episode' | 'category';
  targetLanguage: string;
  contentIds?: string[];
  fields: string[];
  priority?: 'high' | 'medium' | 'low';
  maxItems?: number;
  aiProvider?: 'openai' | 'claude';
}

export interface TranslationResult {
  success: boolean;
  translationId?: string;
  translations?: Record<string, string>;
  error?: string;
  cost?: {
    promptTokens: number;
    completionTokens: number;
    totalCostUsd: number;
  };
}

export interface BatchTranslationResult {
  success: boolean;
  totalRequested: number;
  totalProcessed: number;
  totalSkipped: number;
  translations: Array<{
    contentId: string;
    success: boolean;
    translationId?: string;
    error?: string;
    cost?: number;
  }>;
  totalCostUsd: number;
  error?: string;
}

class TranslationService {
  private async callEdgeFunction(functionName: string, payload: any): Promise<any> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required for translation services');
    }

    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Translation service error: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Translate a single piece of content
   */
  async translateContent(request: TranslationRequest): Promise<TranslationResult> {
    try {
      const functionName = request.aiProvider === 'claude' ? 'translate-content-claude' : 'translate-content';
      const result = await this.callEdgeFunction(functionName, request);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed',
      };
    }
  }

  /**
   * Translate multiple pieces of content in batch
   */
  async batchTranslate(request: BatchTranslationRequest): Promise<BatchTranslationResult> {
    try {
      const result = await this.callEdgeFunction('batch-translate', request);
      return result;
    } catch (error) {
      return {
        success: false,
        totalRequested: 0,
        totalProcessed: 0,
        totalSkipped: 0,
        translations: [],
        totalCostUsd: 0,
        error: error instanceof Error ? error.message : 'Batch translation failed',
      };
    }
  }

  /**
   * Get translation queue - content that needs translation
   */
  async getTranslationQueue(
    contentType: 'insight' | 'episode' | 'category',
    targetLanguage: string,
    limit: number = 20
  ): Promise<any[]> {
    const tableName = contentType === 'category' ? 'insights_categories' : `${contentType}s`;
    const translationTable = `${contentType === 'category' ? 'insights_categories' : contentType + 's'}_translations`;
    
    // Get content that doesn't have translations yet
    const { data: existingTranslations } = await supabase
      .from(translationTable)
      .select(`${contentType === 'category' ? 'category_id' : contentType + '_id'}`)
      .eq('language_code', targetLanguage);
    
    const existingIds = existingTranslations?.map(t => 
      t[contentType === 'category' ? 'category_id' : contentType + '_id']
    ) || [];

    let query = supabase
      .from(tableName)
      .select('*')
      .limit(limit);

    if (existingIds.length > 0) {
      query = query.not('id', 'in', `(${existingIds.join(',')})`);
    }

    // For insights and episodes, only get published content
    if (contentType !== 'category') {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Get translation statistics for admin dashboard
   */
  async getTranslationOverview(): Promise<{
    insights: { total: number; translated: Record<string, number> };
    episodes: { total: number; translated: Record<string, number> };
    categories: { total: number; translated: Record<string, number> };
    totalCosts: number;
  }> {
    // Get total counts
    const [
      { count: insightsTotal },
      { count: episodesTotal },
      { count: categoriesTotal },
    ] = await Promise.all([
      supabase.from('insights').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('episodes').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('insights_categories').select('*', { count: 'exact', head: true }),
    ]);

    // Get translation counts by language
    const [insightsTranslations, episodesTranslations, categoriesTranslations] = await Promise.all([
      supabase.from('insights_translations').select('language_code').eq('translation_status', 'approved'),
      supabase.from('episodes_translations').select('language_code').eq('translation_status', 'approved'),
      supabase.from('insights_categories_translations').select('language_code').eq('translation_status', 'approved'),
    ]);

    // Calculate costs
    const costQueries = await Promise.all([
      supabase.from('insights_translations').select('openai_cost_usd'),
      supabase.from('episodes_translations').select('openai_cost_usd'),
    ]);

    const totalCosts = costQueries.reduce((sum, { data }) => {
      return sum + (data?.reduce((acc, row) => acc + (row.openai_cost_usd || 0), 0) || 0);
    }, 0);

    // Count translations by language
    const countByLanguage = (translations: any[]) => {
      return translations.reduce((acc, { language_code }) => {
        acc[language_code] = (acc[language_code] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    };

    return {
      insights: {
        total: insightsTotal || 0,
        translated: countByLanguage(insightsTranslations.data || []),
      },
      episodes: {
        total: episodesTotal || 0,
        translated: countByLanguage(episodesTranslations.data || []),
      },
      categories: {
        total: categoriesTotal || 0,
        translated: countByLanguage(categoriesTranslations.data || []),
      },
      totalCosts,
    };
  }

  /**
   * Delete a translation
   */
  async deleteTranslation(
    contentType: 'insight' | 'episode' | 'category',
    contentId: string,
    language: string
  ): Promise<boolean> {
    const tableName = `${contentType === 'category' ? 'insights_categories' : contentType + 's'}_translations`;
    const idField = contentType === 'category' ? 'category_id' : contentType + '_id';
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq(idField, contentId)
      .eq('language_code', language);

    return !error;
  }

  /**
   * Update translation status (for review workflow)
   */
  async updateTranslationStatus(
    translationId: string,
    contentType: 'insight' | 'episode' | 'category',
    status: 'pending' | 'in_progress' | 'completed' | 'review_needed' | 'approved' | 'rejected',
    reviewerId?: string
  ): Promise<boolean> {
    const tableName = `${contentType === 'category' ? 'insights_categories' : contentType + 's'}_translations`;
    
    const updateData: any = {
      translation_status: status,
    };

    if (reviewerId && (status === 'approved' || status === 'rejected')) {
      updateData.reviewed_by = reviewerId;
      updateData.reviewed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', translationId);

    return !error;
  }
}

// Singleton instance
export const translationService = new TranslationService();