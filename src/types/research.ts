// AI Research Comparator Type Definitions
// Based on UX analysis and architectural review

export interface ResearchSession {
  id: string;
  title: string;
  topic: string;
  description?: string;
  status: 'draft' | 'processing' | 'completed' | 'error' | 'cancelled';
  currentStep: number;
  totalSteps: number;
  
  // Configuration
  providers: AIProvider[];
  parameters: ResearchParameters;
  
  // Results
  results: ResearchResult[];
  comparison?: ComparisonAnalysis;
  
  // Cost tracking
  estimatedCost: CostEstimate;
  actualCost: CostBreakdown;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  // User context
  userId: string;
  isPublic: boolean;
}

export interface AIProvider {
  id: string;
  name: 'claude' | 'openai';
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

export interface ResearchParameters {
  // Research depth and focus
  researchType: 'market_analysis' | 'competitive_intelligence' | 'trend_analysis' | 'investment_research' | 'custom';
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

export interface ProcessingStage {
  stage: 'initialization' | 'processing' | 'compilation';
  startTime: Date;
  endTime?: Date;
  progress: number; // 0-100
  message: string;
  status: 'pending' | 'active' | 'completed' | 'error';
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