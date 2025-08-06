// AI Research Service
// Handles communication with Supabase Edge Functions for AI research

import { supabase } from '@/integrations/supabase/client';
import type { 
  ResearchSession, 
  ResearchAPIRequest, 
  ResearchAPIResponse, 
  APIResponse,
  CostEstimate,
  ResearchParameters,
  SampleTopic
} from '@/types/research';

class ResearchService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = supabase.supabaseUrl;
  }

  // Get authentication headers for API calls
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  // Create a new research session
  async createSession(
    title: string, 
    topic: string, 
    parameters: ResearchParameters
  ): Promise<APIResponse<ResearchSession>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } };
      }

      // Generate session ID
      const sessionId = `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Estimate cost based on parameters
      const costEstimate = await this.estimateCost(topic, parameters);

      const sessionData: Partial<ResearchSession> = {
        id: sessionId,
        title: title.trim() || `Research: ${topic.slice(0, 50)}...`,
        topic,
        description: `${parameters.researchType} research - ${parameters.depth} depth`,
        status: 'draft',
        currentStep: 1,
        totalSteps: 3,
        providers: this.getDefaultProviders(),
        parameters,
        results: [],
        estimatedCost: costEstimate,
        actualCost: {
          totalCost: 0,
          currency: 'USD',
          byProvider: {},
          byStage: {},
          timestamp: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.id,
        isPublic: false
      };

      return { 
        success: true, 
        data: sessionData as ResearchSession,
        metadata: {
          requestId: sessionId,
          timestamp: new Date(),
          processingTime: 0
        }
      };

    } catch (error) {
      console.error('Error creating research session:', error);
      return { 
        success: false, 
        error: { 
          code: 'CREATE_SESSION_ERROR', 
          message: 'Failed to create research session',
          details: error 
        } 
      };
    }
  }

  // Execute parallel AI research
  async executeResearch(request: ResearchAPIRequest): Promise<APIResponse<ResearchAPIResponse>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/functions/v1/ai-research-parallel`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: errorData.error || `Request failed with status ${response.status}`,
            details: errorData
          }
        };
      }

      const data = await response.json();
      
      if (!data.success) {
        return {
          success: false,
          error: {
            code: 'RESEARCH_FAILED',
            message: data.error || 'Research execution failed',
            details: data
          }
        };
      }

      return {
        success: true,
        data: {
          sessionId: data.sessionId,
          results: data.results || [],
          comparison: data.comparison,
          cost: {
            totalCost: data.totalCost || 0,
            currency: 'USD',
            byProvider: this.parseProviderCosts(data.results),
            byStage: {},
            timestamp: new Date()
          },
          processingTime: data.processingTime || 0,
          status: data.results?.length > 0 ? 'completed' : 'failed'
        },
        metadata: {
          requestId: request.sessionId,
          timestamp: new Date(),
          processingTime: data.processingTime || 0
        }
      };

    } catch (error) {
      console.error('Error executing research:', error);
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: 'Failed to execute research',
          details: error
        }
      };
    }
  }

  // Estimate research cost
  async estimateCost(
    topic: string, 
    parameters: ResearchParameters
  ): Promise<CostEstimate> {
    // Estimate tokens based on topic length and research depth
    const topicTokens = Math.ceil(topic.length / 4); // ~4 chars per token
    
    const depthMultipliers = {
      basic: 1.0,
      comprehensive: 2.0,
      expert: 3.0
    };

    const typeMultipliers = {
      market_analysis: 1.2,
      competitive_intelligence: 1.4,
      trend_analysis: 1.0,
      investment_research: 1.6,
      custom: 1.0
    };

    const baseOutputTokens = 1000;
    const depthMultiplier = depthMultipliers[parameters.depth];
    const typeMultiplier = typeMultipliers[parameters.researchType];
    
    const estimatedInputTokens = topicTokens + 500; // System prompt + context
    const estimatedOutputTokens = Math.round(baseOutputTokens * depthMultiplier * typeMultiplier);

    // Provider costs (Claude and OpenAI)
    const claudeCost = (estimatedInputTokens * 3.0 + estimatedOutputTokens * 15.0) / 1000000;
    const openaiCost = (estimatedInputTokens * 10.0 + estimatedOutputTokens * 30.0) / 1000000;
    
    const totalMinCost = Math.round((claudeCost + openaiCost) * 0.8 * 10000) / 10000; // -20% variance
    const totalMaxCost = Math.round((claudeCost + openaiCost) * 1.3 * 10000) / 10000; // +30% variance
    const expectedCost = Math.round((claudeCost + openaiCost) * 10000) / 10000;

    return {
      minCost: totalMinCost,
      maxCost: totalMaxCost,
      expectedCost,
      currency: 'USD',
      breakdown: {
        claude: {
          minCost: Math.round(claudeCost * 0.8 * 10000) / 10000,
          maxCost: Math.round(claudeCost * 1.3 * 10000) / 10000,
          expectedTokens: estimatedInputTokens + estimatedOutputTokens
        },
        openai: {
          minCost: Math.round(openaiCost * 0.8 * 10000) / 10000,
          maxCost: Math.round(openaiCost * 1.3 * 10000) / 10000,
          expectedTokens: estimatedInputTokens + estimatedOutputTokens
        }
      },
      confidence: 75, // 75% confidence in estimate
      basedOnSimilarQueries: 0 // TODO: Implement historical data
    };
  }

  // Get sample research topics
  getSampleTopics(): SampleTopic[] {
    return [
      {
        id: 'sample_1',
        title: 'AI in Financial Services Market Analysis',
        description: 'Comprehensive analysis of artificial intelligence adoption in banking, fintech, and investment management',
        category: 'technology',
        complexity: 'intermediate',
        estimatedCost: 0.18,
        exampleResults: [
          'Market size: $12.4B by 2025',
          'Key players: JPMorgan, Goldman Sachs, Stripe',
          'Growth drivers: Automation, fraud detection, risk management'
        ]
      },
      {
        id: 'sample_2',
        title: 'Sustainable Investment Trends 2024-2025',
        description: 'Analysis of ESG investing trends, green bonds, and sustainable finance opportunities',
        category: 'finance',
        complexity: 'basic',
        estimatedCost: 0.12,
        exampleResults: [
          'ESG assets under management: $35T globally',
          'Green bond issuance up 25% YoY',
          'Regulatory drivers: EU taxonomy, SEC climate rules'
        ]
      },
      {
        id: 'sample_3',
        title: 'Competitive Analysis: Tesla vs Traditional Automakers',
        description: 'In-depth competitive intelligence on Tesla\'s market position versus Ford, GM, and Volkswagen',
        category: 'business',
        complexity: 'advanced',
        estimatedCost: 0.25,
        exampleResults: [
          'Market share: Tesla 18% of EV market',
          'Production capacity: 2M vehicles annually',
          'Key differentiators: Software, charging network, manufacturing'
        ]
      },
      {
        id: 'sample_4',
        title: 'Healthcare Technology Investment Opportunities',
        description: 'Investment research on telemedicine, digital therapeutics, and health AI companies',
        category: 'healthcare',
        complexity: 'intermediate',
        estimatedCost: 0.20,
        exampleResults: [
          'Telemedicine market: $55B by 2027',
          'Top investments: Mental health, chronic care management',
          'Key risks: Regulatory compliance, reimbursement models'
        ]
      },
      {
        id: 'sample_5',
        title: 'Climate Tech Market Trends and Policy Impact',
        description: 'Trend analysis of climate technology sector including policy drivers and market opportunities',
        category: 'environment',
        complexity: 'intermediate',
        estimatedCost: 0.16,
        exampleResults: [
          'Climate tech funding: $32B in 2023',
          'Policy drivers: IRA, EU Green Deal, carbon pricing',
          'Emerging sectors: Carbon capture, energy storage, alternative proteins'
        ]
      },
      {
        id: 'sample_6',
        title: 'Remote Work Technology Adoption Post-2023',
        description: 'Market analysis of remote work tools, collaboration platforms, and hybrid workplace trends',
        category: 'technology',
        complexity: 'basic',
        estimatedCost: 0.14,
        exampleResults: [
          'Remote work tools market: $4.8B by 2026',
          'Leading platforms: Zoom, Microsoft Teams, Slack',
          'Trends: AI integration, virtual reality meetings, security focus'
        ]
      },
      {
        id: 'sample_7',
        title: 'Cryptocurrency Regulatory Landscape Analysis',
        description: 'Policy analysis of global cryptocurrency regulations and their market impact',
        category: 'policy',
        complexity: 'advanced',
        estimatedCost: 0.22,
        exampleResults: [
          'Regulatory status: 130+ countries with crypto frameworks',
          'Key jurisdictions: US, EU, UK, Singapore, Japan',
          'Impact: Institutional adoption, stablecoin regulations, CBDC development'
        ]
      },
      {
        id: 'sample_8',
        title: 'Biotech IPO Market Analysis 2024',
        description: 'Investment research on biotechnology initial public offerings and market conditions',
        category: 'healthcare',
        complexity: 'advanced',
        estimatedCost: 0.28,
        exampleResults: [
          'Biotech IPOs: 45 companies, $3.2B raised in 2024',
          'Key therapeutic areas: Oncology, neurology, rare diseases',
          'Market conditions: Improved valuations, increased investor interest'
        ]
      }
    ];
  }

  // Helper methods
  private getDefaultProviders() {
    return [
      {
        id: 'claude',
        name: 'claude' as const,
        displayName: 'Claude 3.5 Sonnet',
        model: 'claude-3-5-sonnet-20241022',
        isEnabled: true,
        maxTokens: 8192,
        temperature: 0.3,
        timeout: 300000, // 5 minutes
        costPerInputToken: 0.003, // $3 per 1M tokens
        costPerOutputToken: 0.015, // $15 per 1M tokens
        maxRequestsPerMinute: 50,
        maxRequestsPerHour: 1000,
        status: 'available' as const
      },
      {
        id: 'openai',
        name: 'openai' as const,
        displayName: 'GPT-4 Turbo',
        model: 'gpt-4-turbo',
        isEnabled: true,
        maxTokens: 4096,
        temperature: 0.3,
        timeout: 300000, // 5 minutes
        costPerInputToken: 0.010, // $10 per 1M tokens
        costPerOutputToken: 0.030, // $30 per 1M tokens
        maxRequestsPerMinute: 60,
        maxRequestsPerHour: 1000,
        status: 'available' as const
      }
    ];
  }

  private parseProviderCosts(results: any[]) {
    const providerCosts: Record<string, any> = {};
    
    for (const result of results || []) {
      providerCosts[result.provider] = {
        inputTokens: 0, // TODO: Get from API response
        outputTokens: result.tokensUsed || 0,
        totalTokens: result.tokensUsed || 0,
        inputCost: 0,
        outputCost: result.cost || 0,
        totalCost: result.cost || 0,
        requests: 1
      };
    }
    
    return providerCosts;
  }

  // Validate research parameters
  validateParameters(parameters: ResearchParameters): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!parameters.researchType) {
      errors.push('Research type is required');
    }

    if (!parameters.depth) {
      errors.push('Research depth is required');
    }

    if (!parameters.outputFormat) {
      errors.push('Output format is required');
    }

    if (parameters.focusAreas && parameters.focusAreas.length > 10) {
      errors.push('Maximum 10 focus areas allowed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Format research topic for better AI processing
  formatTopic(topic: string): string {
    return topic
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .slice(0, 1000); // Enforce character limit
  }
}

// Export singleton instance
export const researchService = new ResearchService();
export default researchService;