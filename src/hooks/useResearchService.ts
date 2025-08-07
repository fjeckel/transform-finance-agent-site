import { useMemo } from 'react';
import { researchService } from '@/services/research/researchService';

/**
 * Hook to provide a stable reference to the research service
 * Prevents dynamic import issues in production builds
 */
export const useResearchService = () => {
  const service = useMemo(() => {
    // Validate service methods are available
    if (!researchService || typeof researchService.executeClaudeResearch !== 'function') {
      console.error('Research service not properly initialized');
      return null;
    }
    return researchService;
  }, []);

  return {
    researchService: service,
    isAvailable: service !== null,
    executeClaudeResearch: service?.executeClaudeResearch?.bind(service),
    executeResearch: service?.executeResearch?.bind(service),
  };
};