// Main component
export { StartHereSection } from './StartHereSection';

// Sub-components
export { PathCard } from './components/PathCard';
export { PathSelectionGrid } from './components/PathSelectionGrid';
export { UserJourneyModal } from './components/UserJourneyModal';
export { TrustSignals } from './components/TrustSignals';
export { SocialProof } from './components/SocialProof';

// Types
export type { LearningPath, ContentReference, NextStep } from './types/paths';
export type { 
  UserPathPreferences, 
  UserJourneyStep, 
  JourneyOption, 
  ProfileBuilderData 
} from './types/userProfile';
export type { 
  StartHereAnalyticsEvent, 
  PathAnalytics, 
  UserSegmentAnalytics,
  ContentAnalytics,
  ABTestVariant,
  ConversionFunnel
} from './types/analytics';

// Data
export { learningPaths, trustSignals } from './data/learningPaths';
export { journeySteps, getRecommendedPathFromResponses } from './data/journeySteps';

// Hooks
export { useStartHereAnalytics } from './hooks/useStartHereAnalytics';
export { useContentRecommendations } from './hooks/useContentRecommendations';

// Services
export { startHereEmailService } from './services/emailService';
export type { EmailSubscriptionData, EmailSubscriptionResult } from './services/emailService';

// Utils
export { startHereFeatureManager, useStartHereFeatures } from './utils/featureFlags';