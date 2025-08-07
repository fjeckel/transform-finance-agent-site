import { supabase } from '@/integrations/supabase/client';
import { rateLimitingService, withRateLimit } from './rateLimitingService';

import type { 
  ResearchSession,
  ResearchSessionDB,
  ResearchTaskType,
  ResearchSessionStatus,
  ResearchConfig,
  ResearchResults,
  AIProviderName,
  ResearchError,
  ResearchStatus
} from '@/types/research';

// Service-specific types
export type AIProvider = AIProviderName | 'parallel';

// Type converters for service layer compatibility
export class ResearchTypeConverter {
  static dbToFrontend(dbSession: ResearchSessionDB): ResearchSession {
    return {
      id: dbSession.id,
      title: dbSession.title,
      topic: dbSession.research_prompt,
      description: dbSession.description,
      status: this.convertDBStatusToFrontend(dbSession.status),
      currentStep: 1,
      totalSteps: 3,
      config: {
        topic: dbSession.research_prompt,
        maxTokens: dbSession.max_tokens,
        temperature: dbSession.temperature,
        providers: ['claude', 'openai']
      },
      estimatedCost: {
        minCost: dbSession.estimated_cost_usd * 0.8,
        maxCost: dbSession.estimated_cost_usd * 1.2,
        expectedCost: dbSession.estimated_cost_usd,
        currency: 'USD',
        breakdown: {},
        confidence: 85,
        basedOnSimilarQueries: 10
      },
      totalCost: dbSession.actual_cost_usd,
      createdAt: new Date(dbSession.created_at),
      updatedAt: new Date(dbSession.updated_at),
      completedAt: dbSession.completed_at ? new Date(dbSession.completed_at) : undefined,
      userId: dbSession.user_id,
      isPublic: false
    };
  }

  static configToDBRequest(config: ResearchConfig): Partial<ResearchSessionDB> {
    return {
      research_prompt: config.topic,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      research_type: config.parameters?.researchType || 'custom'
    };
  }

  private static convertDBStatusToFrontend(dbStatus: ResearchSessionStatus): ResearchStatus {
    switch (dbStatus) {
      case 'pending': return 'setup';
      case 'in_progress': return 'processing';
      case 'completed': return 'completed';
      case 'failed': return 'failed';
      case 'cancelled': return 'cancelled';
      default: return 'setup';
    }
  }
}

export interface ResearchResult {
  id: string;
  session_id: string;
  ai_provider: AIProvider;
  model_name: string;
  prompt_text: string;
  response_text?: string;
  response_metadata: any;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  processing_time_ms: number;
  error_message?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface ResearchComparison {
  id: string;
  session_id: string;
  claude_result_id?: string;
  openai_result_id?: string;
  comparison_notes?: string;
  preference_rating?: number; // -5 to 5
  quality_scores: {
    claude?: number;
    openai?: number;
    overall?: number;
  };
  created_by?: string;
  created_at: string;
}

export interface UserResearchQuota {
  id: string;
  user_id: string;
  monthly_token_limit: number;
  monthly_cost_limit_usd: number;
  tokens_used_this_month: number;
  cost_spent_this_month: number;
  current_period_start: string;
  current_period_end: string;
  quota_reset_day: number;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResearchTemplate {
  id: string;
  name: string;
  description?: string;
  research_type: ResearchTaskType;
  prompt_template: string;
  suggested_max_tokens: number;
  suggested_temperature: number;
  is_public: boolean;
  created_by?: string;
  usage_count: number;
  average_rating?: number;
  created_at: string;
  updated_at: string;
}

// Request/Response interfaces for API calls
export interface CreateSessionRequest {
  title: string;
  description?: string;
  research_type: ResearchTaskType;
  research_prompt: string;
  max_tokens?: number;
  temperature?: number;
  priority?: 'high' | 'medium' | 'low';
}

export interface ExecuteResearchRequest {
  sessionId: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  priority?: 'high' | 'medium' | 'low';
  researchType?: ResearchTaskType;
  enableRetry?: boolean;
  retryAttempts?: number;
  aiProvider?: AIProvider;
  providers?: ('claude' | 'openai')[];
  timeoutMs?: number;
}

export interface ResearchExecutionResult {
  success: boolean;
  resultId?: string;
  sessionId?: string;
  response?: string;
  results?: Array<{
    provider: 'claude' | 'openai';
    success: boolean;
    resultId?: string;
    response?: string;
    error?: string;
    cost?: {
      promptTokens: number;
      completionTokens: number;
      totalCostUsd: number;
    };
    processingTimeMs?: number;
    metadata?: any;
  }>;
  comparisonId?: string;
  totalCost?: number;
  totalProcessingTime?: number;
  cost?: {
    promptTokens: number;
    completionTokens: number;
    totalCostUsd: number;
  };
  processingTimeMs?: number;
  metadata?: any;
  error?: string;
  summary?: {
    successful: number;
    failed: number;
    totalProviders: number;
  };
}

export interface CostTrackingData {
  totalCostThisMonth: number;
  totalTokensThisMonth: number;
  costByProvider: Record<string, number>;
  tokensByProvider: Record<string, number>;
  recentSessions: Array<{
    id: string;
    title: string;
    cost: number;
    tokens: number;
    created_at: string;
  }>;
  dailyCosts: Array<{
    date: string;
    cost: number;
    tokens: number;
  }>;
}

class ResearchService {
  /**
   * Call an edge function with authentication and rate limiting
   */
  private async callEdgeFunction(functionName: string, payload: any): Promise<any> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required for research services');
    }

    // Determine provider from function name for rate limiting
    let provider = 'parallel';
    if (functionName.includes('claude')) provider = 'claude';
    else if (functionName.includes('openai')) provider = 'openai';

    // Create rate-limited function
    const rateLimitedFetch = withRateLimit(provider, async () => {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || `API error: ${response.status} ${response.statusText}`;
        
        // Enhance error for rate limiting detection
        if (response.status === 429) {
          throw new Error(`rate_limit_exceeded: ${errorMessage}`);
        }
        if (response.status >= 500) {
          throw new Error(`service_unavailable: ${errorMessage}`);
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    }, {
      maxRetries: 3,
      baseDelayMs: 1000,
      backoffMultiplier: 2,
      retryableErrors: [
        'rate_limit_exceeded',
        'service_unavailable', 
        'timeout',
        'network_error',
        'temporary_failure'
      ]
    });

    return rateLimitedFetch();
  }

  /**
   * Create a new research session (legacy method for backwards compatibility)
   */
  async createSession(request: CreateSessionRequest): Promise<ResearchSession>;
  
  /**
   * Create a new research session (frontend-friendly signature)
   */
  async createSession(
    title: string, 
    topic: string, 
    parameters: import('@/types/research').ResearchParameters
  ): Promise<{ success: boolean; data?: ResearchSession; error?: { message: string } }>;
  
  /**
   * Create a new research session (implementation)
   */
  async createSession(
    requestOrTitle: CreateSessionRequest | string,
    topic?: string,
    parameters?: import('@/types/research').ResearchParameters
  ): Promise<ResearchSession | { success: boolean; data?: ResearchSession; error?: { message: string } }> {
    try {
      let insertData: any;
      
      if (typeof requestOrTitle === 'string') {
        // Frontend call signature
        insertData = {
          title: requestOrTitle,
          research_type: parameters?.researchType || 'custom',
          research_prompt: topic!,
          max_tokens: 8000,
          temperature: 0.3,
          priority: 'medium' as const,
          estimated_cost_usd: 0.05 // Default estimate
        };
      } else {
        // Legacy call signature
        insertData = {
          title: requestOrTitle.title,
          description: requestOrTitle.description,
          research_type: requestOrTitle.research_type,
          research_prompt: requestOrTitle.research_prompt,
          max_tokens: requestOrTitle.max_tokens || 8000,
          temperature: requestOrTitle.temperature || 0.3,
          priority: requestOrTitle.priority || 'medium'
        };
      }

      const { data, error } = await supabase
        .from('research_sessions')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      
      // Convert DB session to frontend session
      const frontendSession = ResearchTypeConverter.dbToFrontend(data as ResearchSessionDB);
      
      // Return based on call signature
      if (typeof requestOrTitle === 'string') {
        return { success: true, data: frontendSession };
      } else {
        return frontendSession;
      }
      
    } catch (error) {
      console.error('Session creation error:', error);
      
      if (typeof requestOrTitle === 'string') {
        return { 
          success: false, 
          error: { message: error instanceof Error ? error.message : 'Failed to create session' }
        };
      } else {
        throw error;
      }
    }
  }

  /**
   * Execute research using Claude AI
   */
  async executeClaudeResearch(request: ExecuteResearchRequest): Promise<ResearchExecutionResult> {
    try {
      const result = await this.callEdgeFunction('ai-research-claude', request);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Claude research failed',
      };
    }
  }

  /**
   * Execute research using OpenAI
   */
  async executeOpenAIResearch(request: ExecuteResearchRequest): Promise<ResearchExecutionResult> {
    try {
      const result = await this.callEdgeFunction('ai-research-openai', request);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OpenAI research failed',
      };
    }
  }

  /**
   * Execute parallel research using both Claude and OpenAI
   */
  async executeParallelResearch(request: ExecuteResearchRequest): Promise<ResearchExecutionResult> {
    try {
      const result = await this.callEdgeFunction('ai-research-parallel', request);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Parallel research failed',
      };
    }
  }

  /**
   * Execute research with automatic provider selection
   */
  async executeResearch(request: ExecuteResearchRequest): Promise<ResearchExecutionResult> {
    const provider = request.aiProvider || 'parallel';

    switch (provider) {
      case 'claude':
        return this.executeClaudeResearch(request);
      case 'openai':
        return this.executeOpenAIResearch(request);
      case 'parallel':
      default:
        return this.executeParallelResearch(request);
    }
  }

  /**
   * Get user's research sessions
   */
  async getUserSessions(limit: number = 20, offset: number = 0): Promise<ResearchSession[]> {
    const { data, error } = await supabase
      .from('research_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data || []).map(session => ResearchTypeConverter.dbToFrontend(session as ResearchSessionDB));
  }

  /**
   * Get research session by ID
   */
  async getSession(sessionId: string): Promise<ResearchSession | null> {
    const { data, error } = await supabase
      .from('research_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return data ? ResearchTypeConverter.dbToFrontend(data as ResearchSessionDB) : null;
  }

  /**
   * Get research results for a session
   */
  async getSessionResults(sessionId: string): Promise<ResearchResult[]> {
    const { data, error } = await supabase
      .from('research_results')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get research comparison for a session
   */
  async getSessionComparison(sessionId: string): Promise<ResearchComparison | null> {
    const { data, error } = await supabase
      .from('research_comparisons')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" errors
    return data;
  }

  /**
   * Update research session
   */
  async updateSession(sessionId: string, updates: Partial<ResearchSession>): Promise<ResearchSession> {
    // Convert frontend updates to DB format
    const dbUpdates: Partial<ResearchSessionDB> = {};
    
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.status) {
      // Convert frontend status to DB status
      const statusMap: Record<ResearchStatus, ResearchSessionStatus> = {
        'setup': 'pending',
        'processing': 'in_progress',
        'completed': 'completed',
        'failed': 'failed',
        'cancelled': 'cancelled'
      };
      dbUpdates.status = statusMap[updates.status];
    }
    if (updates.totalCost) dbUpdates.actual_cost_usd = updates.totalCost;

    const { data, error } = await supabase
      .from('research_sessions')
      .update(dbUpdates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return ResearchTypeConverter.dbToFrontend(data as ResearchSessionDB);
  }

  /**
   * Delete research session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('research_sessions')
      .delete()
      .eq('id', sessionId);

    return !error;
  }

  /**
   * Get user's research quota information
   */
  async getUserQuota(): Promise<UserResearchQuota | null> {
    const { data, error } = await supabase
      .from('user_research_quotas')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Get comprehensive cost tracking data for the current user
   */
  async getCostTrackingData(): Promise<CostTrackingData> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    // Get current month boundaries
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get cost data for current month
    const { data: costs, error: costsError } = await supabase
      .from('research_costs')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEnd.toISOString())
      .order('created_at', { ascending: false });

    if (costsError) throw costsError;

    // Get recent research sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('research_sessions')
      .select('id, title, actual_cost_usd, created_at')
      .eq('user_id', user.id)
      .not('actual_cost_usd', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (sessionsError) throw sessionsError;

    // Calculate aggregated data
    const totalCostThisMonth = costs?.reduce((sum, cost) => sum + Number(cost.cost_usd || 0), 0) || 0;
    const totalTokensThisMonth = costs?.reduce((sum, cost) => sum + (cost.total_tokens || 0), 0) || 0;

    // Group by provider
    const costByProvider: Record<string, number> = {};
    const tokensByProvider: Record<string, number> = {};

    costs?.forEach(cost => {
      const provider = cost.ai_provider;
      costByProvider[provider] = (costByProvider[provider] || 0) + Number(cost.cost_usd || 0);
      tokensByProvider[provider] = (tokensByProvider[provider] || 0) + (cost.total_tokens || 0);
    });

    // Calculate daily costs for the last 30 days
    const dailyCostMap = new Map<string, { cost: number; tokens: number }>();
    
    costs?.forEach(cost => {
      const date = new Date(cost.created_at).toISOString().split('T')[0];
      const current = dailyCostMap.get(date) || { cost: 0, tokens: 0 };
      current.cost += Number(cost.cost_usd || 0);
      current.tokens += cost.total_tokens || 0;
      dailyCostMap.set(date, current);
    });

    const dailyCosts = Array.from(dailyCostMap.entries()).map(([date, data]) => ({
      date,
      cost: data.cost,
      tokens: data.tokens
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Format recent sessions
    const recentSessions = sessions?.map(session => ({
      id: session.id,
      title: session.title,
      cost: Number(session.actual_cost_usd || 0),
      tokens: 0, // Would need to join with results to get token count
      created_at: session.created_at
    })) || [];

    return {
      totalCostThisMonth,
      totalTokensThisMonth,
      costByProvider,
      tokensByProvider,
      recentSessions,
      dailyCosts
    };
  }

  /**
   * Get public research templates
   */
  async getPublicTemplates(researchType?: ResearchTaskType): Promise<ResearchTemplate[]> {
    let query = supabase
      .from('research_templates')
      .select('*')
      .eq('is_public', true)
      .order('usage_count', { ascending: false });

    if (researchType) {
      query = query.eq('research_type', researchType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get user's private templates
   */
  async getUserTemplates(): Promise<ResearchTemplate[]> {
    const { data, error } = await supabase
      .from('research_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new research template
   */
  async createTemplate(template: Omit<ResearchTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'average_rating' | 'created_by'>): Promise<ResearchTemplate> {
    const { data, error } = await supabase
      .from('research_templates')
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update comparison with user preferences
   */
  async updateComparison(
    comparisonId: string, 
    preferenceRating?: number, 
    notes?: string,
    qualityScores?: { claude?: number; openai?: number; overall?: number }
  ): Promise<ResearchComparison> {
    const updates: any = {};
    
    if (preferenceRating !== undefined) updates.preference_rating = preferenceRating;
    if (notes !== undefined) updates.comparison_notes = notes;
    if (qualityScores !== undefined) updates.quality_scores = qualityScores;

    const { data, error } = await supabase
      .from('research_comparisons')
      .update(updates)
      .eq('id', comparisonId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get rate limit status for all providers
   */
  getRateLimitStatus(): Record<string, {
    isBlocked: boolean;
    remainingRequests: number;
    resetTimeMs?: number;
    windowMs: number;
  }> {
    return {
      claude: rateLimitingService.getRateLimitStatus('claude'),
      openai: rateLimitingService.getRateLimitStatus('openai'),
      parallel: rateLimitingService.getRateLimitStatus('parallel')
    };
  }

  /**
   * Get provider performance metrics
   */
  getProviderMetrics(): Record<string, any> {
    return rateLimitingService.getAllMetrics();
  }

  /**
   * Estimate wait time before next request for a provider
   */
  estimateWaitTime(provider: string): number {
    return rateLimitingService.estimateWaitTime(provider);
  }

  /**
   * Process multiple research requests in batches with rate limiting
   */
  async processBatchResearch(
    requests: ExecuteResearchRequest[],
    provider: string = 'parallel',
    concurrency: number = 3
  ): Promise<Array<{
    success: boolean;
    result?: ResearchExecutionResult;
    error?: string;
    request: ExecuteResearchRequest;
  }>> {
    const processor = async (request: ExecuteResearchRequest) => {
      return this.executeResearch({ ...request, aiProvider: provider as AIProvider });
    };

    return rateLimitingService.processBatch(provider, requests, processor, concurrency);
  }

  /**
   * Get research analytics/statistics
   */
  async getResearchAnalytics(): Promise<{
    totalSessions: number;
    completedSessions: number;
    totalCostAllTime: number;
    totalTokensAllTime: number;
    averageSessionCost: number;
    providerUsageStats: Record<string, number>;
    researchTypeStats: Record<string, number>;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    // Get session counts
    const { count: totalSessions } = await supabase
      .from('research_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: completedSessions } = await supabase
      .from('research_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed');

    // Get all-time costs
    const { data: allCosts } = await supabase
      .from('research_costs')
      .select('cost_usd, total_tokens, ai_provider')
      .eq('user_id', user.id);

    const { data: sessions } = await supabase
      .from('research_sessions')
      .select('research_type, actual_cost_usd')
      .eq('user_id', user.id);

    const totalCostAllTime = allCosts?.reduce((sum, cost) => sum + Number(cost.cost_usd || 0), 0) || 0;
    const totalTokensAllTime = allCosts?.reduce((sum, cost) => sum + (cost.total_tokens || 0), 0) || 0;
    const averageSessionCost = totalSessions && totalSessions > 0 ? totalCostAllTime / totalSessions : 0;

    // Provider usage stats
    const providerUsageStats: Record<string, number> = {};
    allCosts?.forEach(cost => {
      providerUsageStats[cost.ai_provider] = (providerUsageStats[cost.ai_provider] || 0) + 1;
    });

    // Research type stats
    const researchTypeStats: Record<string, number> = {};
    sessions?.forEach(session => {
      researchTypeStats[session.research_type] = (researchTypeStats[session.research_type] || 0) + 1;
    });

    return {
      totalSessions: totalSessions || 0,
      completedSessions: completedSessions || 0,
      totalCostAllTime,
      totalTokensAllTime,
      averageSessionCost,
      providerUsageStats,
      researchTypeStats
    };
  }
}

// Singleton instance
export const researchService = new ResearchService();