import { LucideIcon } from 'lucide-react';

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  topics: string[];
  outcomes: string[];
  prerequisites?: string[];
  contentTypes: ('episode' | 'insight' | 'memo')[];
  recommendedContent: ContentReference[];
  nextSteps: NextStep[];
  targetAudience: string[];
  popularity: number;
}

export interface ContentReference {
  id: string;
  type: 'episode' | 'insight' | 'memo';
  title: string;
  slug: string;
  estimatedTime?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  priority: number;
  description?: string;
  tags?: string[];
}

export interface NextStep {
  id: string;
  title: string;
  description: string;
  actionType: 'content' | 'assessment' | 'email_signup' | 'external_link';
  actionData: any;
  order: number;
  isRequired?: boolean;
}

export interface PathProgress {
  pathId: string;
  userId?: string;
  sessionId: string;
  currentStep: number;
  completedContent: string[];
  bookmarkedContent: string[];
  timeSpent: number;
  lastActive: string;
  completionPercentage: number;
}

export interface PathRecommendation {
  pathId: string;
  score: number;
  reason: string;
  confidence: 'low' | 'medium' | 'high';
  matchingFactors: string[];
}