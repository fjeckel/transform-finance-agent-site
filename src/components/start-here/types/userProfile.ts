export interface UserPathPreferences {
  id?: string;
  userId?: string;
  sessionId: string;
  selectedPath?: string;
  goals: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  role: string;
  companySize?: 'startup' | 'scaleup' | 'enterprise' | 'consulting';
  industry?: string;
  timeCommitment: 'light' | 'moderate' | 'intensive';
  preferredContentTypes: ('episodes' | 'insights' | 'memos')[];
  learningStyle: 'audio' | 'reading' | 'mixed';
  primaryChallenges: string[];
  completedContent: string[];
  bookmarkedContent: string[];
  emailCaptured: boolean;
  newsletterSubscribed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserJourneyStep {
  id: string;
  title: string;
  description: string;
  type: 'single_select' | 'multi_select' | 'text_input' | 'slider';
  options?: JourneyOption[];
  validation?: {
    required?: boolean;
    minSelections?: number;
    maxSelections?: number;
    pattern?: string;
  };
  showCondition?: (preferences: Partial<UserPathPreferences>) => boolean;
}

export interface JourneyOption {
  id: string;
  label: string;
  description?: string;
  icon?: any;
  value: string | number;
  metadata?: Record<string, any>;
}

export interface ProfileBuilderData {
  currentStep: number;
  totalSteps: number;
  responses: Record<string, any>;
  isComplete: boolean;
  estimatedTimeRemaining: number;
}