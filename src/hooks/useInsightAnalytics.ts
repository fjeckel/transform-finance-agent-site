import { useEffect, useRef } from 'react';
import { analytics } from '@/utils/analytics';

interface UseInsightAnalyticsProps {
  insightId: string;
  insightTitle: string;
  insightType: string;
  readingTime?: number;
}

export const useInsightAnalytics = ({ 
  insightId, 
  insightTitle, 
  insightType, 
  readingTime 
}: UseInsightAnalyticsProps) => {
  const startTime = useRef<number>(Date.now());

  // Track insight view on mount
  useEffect(() => {
    analytics.track('insight_view', {
      insight_id: insightId,
      insight_title: insightTitle,
      insight_type: insightType,
      reading_time: readingTime,
    });
  }, [insightId, insightTitle, insightType, readingTime]);

  // Helper functions to track specific actions
  const trackBookmark = () => {
    analytics.track('insight_bookmark', { insight_id: insightId });
  };

  const trackShare = (platform: string) => {
    analytics.track('insight_share', { insight_id: insightId, platform });
  };

  const trackDownload = (downloadType: string) => {
    analytics.track('insight_download', { insight_id: insightId, downloadType });
  };

  const trackSearchResultClick = (searchQuery: string, position: number) => {
    analytics.track('insight_search_click', { insight_id: insightId, searchQuery, position });
  };

  return {
    trackBookmark,
    trackShare,
    trackDownload,
    trackSearchResultClick,
  };
};