export interface StartHereAnalyticsEvent {
  event_type: 
    | 'section_viewed'
    | 'path_card_hovered' 
    | 'path_selected'
    | 'journey_started'
    | 'step_completed'
    | 'step_skipped'
    | 'journey_completed'
    | 'journey_abandoned'
    | 'email_captured'
    | 'episode_played'
    | 'content_downloaded'
    | 'recommendation_clicked'
    | 'social_proof_clicked'
    | 'trust_signal_viewed';
  
  event_data: Record<string, any>;
  path_id?: string;
  user_id?: string;
  session_id: string;
  timestamp: string;
  user_agent?: string;
  referrer?: string;
  page_url: string;
}

export interface PathAnalytics {
  pathId: string;
  totalViews: number;
  totalSelections: number;
  totalCompletions: number;
  averageTimeSpent: number;
  conversionRate: number;
  dropoffPoints: DropoffAnalysis[];
  userSegments: UserSegmentAnalytics[];
  contentPerformance: ContentAnalytics[];
}

export interface DropoffAnalysis {
  stepId: string;
  stepName: string;
  dropoffRate: number;
  commonReasons?: string[];
}

export interface UserSegmentAnalytics {
  segmentName: string;
  segmentCriteria: Record<string, any>;
  userCount: number;
  conversionRate: number;
  averageEngagement: number;
  preferredPaths: string[];
}

export interface ContentAnalytics {
  contentId: string;
  contentType: 'episode' | 'insight' | 'memo';
  recommendationCount: number;
  clickCount: number;
  completionCount: number;
  rating?: number;
  engagementScore: number;
}

export interface ABTestVariant {
  testName: string;
  variantName: string;
  variantConfig: Record<string, any>;
  trafficPercentage: number;
  isActive: boolean;
  startDate: string;
  endDate?: string;
}

export interface ConversionFunnel {
  stage: 'viewed' | 'engaged' | 'path_selected' | 'journey_started' | 'email_captured' | 'content_consumed';
  userCount: number;
  conversionRate: number;
  dropoffRate: number;
  averageTimeInStage: number;
}