// Main exports for the AI Research Comparator system
export { ResearchWizard } from './ResearchWizard';
export { ProgressIndicator } from './ProgressIndicator';
export { CostTracker } from './CostTracker';
export { LoadingAnimations, DualProcessingAnimation } from './animations/LoadingAnimations';
export { ResearchSetupStep } from './steps/ResearchSetupStep';
export { ProcessingStep } from './steps/ProcessingStep';
export { ResultsStep } from './steps/ResultsStep';
export { default as ResearchErrorBoundary, withResearchErrorBoundary, useResearchErrorHandler } from './ResearchErrorBoundary';

// Re-export types
export type * from '@/types/research';