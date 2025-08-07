// AI Research Comparator Type Definitions
// Unified type system resolving frontend/backend conflicts

// === Core Session Types ===
export interface ResearchSession {
  id: string;
  title: string;
  topic: string;
  description?: string;
  status: ResearchStatus;
  currentStep: number;
  totalSteps: number;
  
  // Configuration (frontend structure)
  config: ResearchConfig;
  
  // Results (unified structure)
  results?: ResearchResults;
  comparison?: ComparisonAnalysis;
  
  // Cost tracking
  estimatedCost: CostEstimate;
  actualCost?: CostBreakdown;
  totalCost: number;
  processingTime?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  // User context
  userId: string;
  isPublic: boolean;
  
  // Error handling
  error?: ResearchError;
}

// Database representation (for service layer)
export interface ResearchSessionDB {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  research_type: ResearchTaskType;
  research_prompt: string;
  max_tokens: number;
  temperature: number;
  status: ResearchSessionStatus;
  priority: 'high' | 'medium' | 'low';
  estimated_cost_usd: number;
  actual_cost_usd: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

// Status types
export type ResearchStatus = 'setup' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type ResearchSessionStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

// Configuration interface (what step components expect)
export interface ResearchConfig {
  topic: string;
  optimizedPrompt?: string;
  maxTokens: number;
  temperature: number;
  providers: ('claude' | 'openai')[];
  parameters?: ResearchParameters;
}

// Results structure (unified for components)
export interface ResearchResults {
  claude?: AIResult;
  openai?: AIResult;
}

// Step component props (missing definition)
export interface ResearchStepProps {
  session?: ResearchSession | null;
  onNext?: () => void;
  onPrevious?: () => void;
  onCancel?: () => void;
  className?: string;
}

// === AI Provider Types ===
export type AIProviderName = 'claude' | 'openai';

export interface AIProvider {
  id: string;
  name: AIProviderName;
  displayName: string;
  model: string;
  isEnabled: boolean;
  
  // Configuration
  maxTokens: number;
  temperature: number;
  timeout: number; // milliseconds
  
  // Pricing
  costPerInputToken: number;  // USD per 1K tokens
  costPerOutputToken: number; // USD per 1K tokens
  
  // Rate limiting
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  
  // Status
  status: 'available' | 'rate_limited' | 'error' | 'maintenance';
  lastUsed?: Date;
}

// AI Result types (what components actually expect)
export interface AIResult {
  provider: AIProviderName;
  content: string;
  metadata: {
    model: string;
    tokensUsed: number;
    cost: number;
    processingTime: number;
    finishReason: string;
  };
  timestamp: Date;
  status: AIResultStatus;
}

export type AIResultStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Processing progress types (expected by ProcessingStep)
export interface ProcessingProgress {
  provider: AIProviderName;
  stage: ProcessingStage;
  percentage: number;
  message: string;
  timestamp: Date;
}

export type ProcessingStage = 'initializing' | 'processing' | 'finalizing';

// === Missing Types for Components ===

// Sample topic interface (expected by ResearchSetupStep)
export interface SampleTopic {
  id: string;
  title: string;
  description: string;
  category: TopicCategory;
  estimatedCost: number;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  keywords: string[];
  prompt: string;
  expectedOutput: string;
}

export type TopicCategory = 
  | 'finance' 
  | 'technology' 
  | 'business' 
  | 'marketing' 
  | 'healthcare' 
  | 'education' 
  | 'sustainability' 
  | 'general';

// Export formats (expected by ResultsStep)
export type ExportFormat = 'pdf' | 'docx' | 'markdown' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeComparison: boolean;
}

// Research task types (from service layer)
export type ResearchTaskType = 
  | 'comparative_analysis' 
  | 'market_research' 
  | 'competitive_analysis' 
  | 'trend_analysis' 
  | 'risk_assessment' 
  | 'investment_analysis' 
  | 'custom';

// Research error interface (comprehensive)
export interface ResearchError {
  type: 'api_error' | 'validation_error' | 'timeout_error' | 'rate_limit_error';
  message: string;
  timestamp: Date;
  recoverable: boolean;
  retryCount: number;
  details?: Record<string, any>;
}

export interface ResearchParameters {
  // Research depth and focus
  researchType: ResearchTaskType;
  depth: 'basic' | 'comprehensive' | 'expert';
  focusAreas: string[];
  
  // Output preferences
  outputFormat: 'summary' | 'detailed' | 'executive' | 'technical';
  outputLength: 'concise' | 'standard' | 'comprehensive';
  includeSourceData: boolean;
  
  // Advanced options
  timeframe?: {
    start?: Date;
    end?: Date;
    period?: 'current' | 'historical' | 'forecast';
  };
  
  // Geographical and industry context
  regions?: string[];
  industries?: string[];
  targetAudience?: 'executives' | 'analysts' | 'investors' | 'general';
}

// Legacy ResearchResult interface (for backwards compatibility with service layer)
export interface ResearchResult {
  id: string;
  sessionId: string;
  provider: AIProvider;
  
  // Content
  content: string;
  summary: string;
  keyInsights: string[];
  
  // Metadata
  metadata: {
    tokensUsed: {
      input: number;
      output: number;
      total: number;
    };
    responseTime: number; // milliseconds
    requestTime: Date;
    model: string;
    temperature: number;
    qualityScore?: number; // 0-100
    confidence?: number;   // 0-100
  };
  
  // Cost information
  cost: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    currency: 'USD';
  };
  
  // Processing status
  status: 'pending' | 'processing' | 'completed' | 'error' | 'timeout';
  error?: ResearchError;
  
  // Performance metrics
  processingStages: ProcessingStage[];
}

// Legacy ProcessingStage interface (different from the one used by components)
export interface LegacyProcessingStage {
  stage: 'initialization' | 'processing' | 'compilation';
  startTime: Date;
  endTime?: Date;
  progress: number; // 0-100
  message: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

// === Service Layer Compatibility Types ===
// These types match what's expected by the existing service layer

// Service layer types (re-exported from researchService.ts for compatibility)
export type { 
  ResearchSessionDB,
  ResearchTaskType,
  ResearchSessionStatus 
};

// Conversion utility types
export interface ServiceToFrontendMapper {
  // Convert database session to frontend session
  mapSessionFromDB(dbSession: ResearchSessionDB): ResearchSession;
  
  // Convert frontend config to service request
  mapConfigToServiceRequest(config: ResearchConfig): {
    research_prompt: string;
    max_tokens: number;
    temperature: number;
    research_type: ResearchTaskType;
  };
}

// === Additional Missing Types for Step Components ===

// Form interfaces for wizard steps (used by ResearchSetupStep)
export interface TopicInputForm {
  topic: string;
  researchType: ResearchTaskType;
  depth: 'basic' | 'comprehensive' | 'expert';
  focusAreas: string[];
  timeframe?: {
    period: 'current' | 'historical' | 'forecast';
    startDate?: Date;
    endDate?: Date;
  };
}

export interface ComparisonAnalysis {
  id: string;
  sessionId: string;
  
  // Comparative metrics
  accuracy: ProviderComparison;
  depth: ProviderComparison;
  relevance: ProviderComparison;
  clarity: ProviderComparison;
  innovation: ProviderComparison;
  
  // Overall assessment
  overallScores: Record<string, number>; // providerId -> score
  recommendation: string;
  strengths: Record<string, string[]>; // providerId -> strengths
  weaknesses: Record<string, string[]>; // providerId -> weaknesses
  
  // Synthesis
  bestSections: Record<string, string>; // section -> providerId
  synthesisStrategy: string;
  
  createdAt: Date;
  generatedBy: string; // AI provider used for comparison
}

export interface ProviderComparison {
  claude?: number;
  openai?: number;
  notes?: string;
}

export interface CostEstimate {
  minCost: number;
  maxCost: number;
  expectedCost: number;
  currency: 'USD';
  
  breakdown: {
    [providerId: string]: {
      minCost: number;
      maxCost: number;
      expectedTokens: number;
    };
  };
  
  confidence: number; // 0-100
  basedOnSimilarQueries: number;
}

export interface CostBreakdown {
  totalCost: number;
  currency: 'USD';
  
  byProvider: Record<string, {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    inputCost: number;
    outputCost: number;
    totalCost: number;
    requests: number;
  }>;
  
  byStage: Record<string, {
    cost: number;
    duration: number; // milliseconds
  }>;
  
  timestamp: Date;
}

export interface ResearchError {
  code: string;
  message: string;
  provider?: string;
  recoverable: boolean;
  retryAfter?: number; // seconds
  details?: Record<string, any>;
  timestamp: Date;
}

// Wizard-specific interfaces
export interface WizardStep {
  id: number;
  title: string;
  description: string;
  component: string;
  status: 'pending' | 'current' | 'completed' | 'error';
  isClickable: boolean;
  isValid: boolean;
  data?: Record<string, any>;
}

export interface WizardState {
  currentStep: number;
  steps: WizardStep[];
  session: ResearchSession | null;
  canNavigate: (targetStep: number) => boolean;
  navigate: (targetStep: number) => void;
  updateStepData: (stepId: number, data: Record<string, any>) => void;
  validateStep: (stepId: number) => Promise<boolean>;
}

// UI-specific interfaces
export interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  onStepClick?: (step: number) => void;
  canNavigate?: (step: number) => boolean;
  className?: string;
}

export interface CostTrackerProps {
  estimate: CostEstimate;
  actual?: CostBreakdown;
  showBreakdown?: boolean;
  onBreakdownToggle?: () => void;
  className?: string;
}

export interface ComparisonViewProps {
  results: ResearchResult[];
  analysis?: ComparisonAnalysis;
  currentView: 'claude' | 'openai' | 'side-by-side' | 'synthesis';
  onViewChange: (view: string) => void;
  isMobile?: boolean;
}

export interface LoadingStateProps {
  stage: ProcessingStage;
  provider?: string;
  estimatedTimeRemaining?: number;
  canCancel?: boolean;
  onCancel?: () => void;
}

// Form interfaces for wizard steps
export interface TopicInputForm {
  topic: string;
  researchType: ResearchParameters['researchType'];
  depth: ResearchParameters['depth'];
  focusAreas: string[];
  timeframe?: {
    period: 'current' | 'historical' | 'forecast';
    startDate?: Date;
    endDate?: Date;
  };
}

export interface ProviderSelectionForm {
  selectedProviders: string[]; // provider IDs
  configuration: Record<string, {
    temperature: number;
    maxTokens: number;
    customPrompts?: string;
  }>;
}

export interface ReviewForm {
  topic: string;
  parameters: ResearchParameters;
  providers: AIProvider[];
  estimatedCost: CostEstimate;
  acceptsCost: boolean;
  acceptsTerms: boolean;
}

// Export configuration
export interface ExportConfig {
  format: 'pdf' | 'docx' | 'markdown' | 'json';
  includeSections: {
    summary: boolean;
    fullResults: boolean;
    comparison: boolean;
    methodology: boolean;
    costBreakdown: boolean;
  };
  template?: string;
  customFields?: Record<string, string>;
}

// API response interfaces
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId: string;
    timestamp: Date;
    processingTime: number;
  };
}

export interface ResearchAPIRequest {
  sessionId: string;
  topic: string;
  parameters: ResearchParameters;
  providers: string[]; // provider IDs
}

export interface ResearchAPIResponse {
  sessionId: string;
  results: ResearchResult[];
  comparison?: ComparisonAnalysis;
  cost: CostBreakdown;
  processingTime: number;
  status: 'completed' | 'partial' | 'failed';
}

// Sample data interfaces
export interface SampleTopic {
  id: string;
  title: string;
  description: string;
  category: 'technology' | 'healthcare' | 'finance' | 'environment' | 'business' | 'policy';
  complexity: 'basic' | 'intermediate' | 'advanced';
  estimatedCost: number;
  exampleResults?: string[];
}

// User preferences and settings
export interface UserResearchPreferences {
  userId: string;
  
  // Default settings
  defaultProviders: string[];
  defaultDepth: ResearchParameters['depth'];
  defaultOutputFormat: ResearchParameters['outputFormat'];
  
  // Budget and limits
  monthlyBudget?: number;
  alertThreshold?: number; // percentage of budget
  
  // UI preferences
  preferredView: 'side-by-side' | 'tabbed';
  showAdvancedOptions: boolean;
  autoSaveResults: boolean;
  
  // Notifications
  emailOnCompletion: boolean;
  emailOnErrors: boolean;
  
  updatedAt: Date;
}

// Analytics and tracking
export interface ResearchAnalytics {
  userId: string;
  sessionId: string;
  
  // Usage metrics
  totalSessions: number;
  totalCost: number;
  averageSessionCost: number;
  
  // Performance metrics
  averageProcessingTime: number;
  successRate: number;
  
  // Provider usage
  providerUsage: Record<string, {
    sessions: number;
    cost: number;
    averageRating: number;
  }>;
  
  // Time-based data
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
}