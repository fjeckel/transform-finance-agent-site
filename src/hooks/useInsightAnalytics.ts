import { useEffect, useRef } from 'react';
import { useAnalytics } from '@/utils/analytics';

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
  const analytics = useAnalytics();
  const startTime = useRef<number>(Date.now());
  const scrollPercentage = useRef<number>(0);
  const hasTrackedView = useRef<boolean>(false);

  // Track insight view on mount
  useEffect(() => {
    if (!hasTrackedView.current) {
      analytics.trackInsight({
        insight_id: insightId,
        action: 'view',
        metadata: {
          insight_title: insightTitle,
          insight_type: insightType,
          reading_time: readingTime,
          referrer: document.referrer,
          timestamp: Date.now(),
        },
      });
      hasTrackedView.current = true;
    }
  }, [insightId, insightTitle, insightType, readingTime, analytics]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = Math.round((scrollTop / documentHeight) * 100);
      
      // Track significant scroll milestones
      if (scrolled > scrollPercentage.current && scrolled % 25 === 0) {
        scrollPercentage.current = scrolled;
        analytics.trackInsight({
          insight_id: insightId,
          action: 'view',
          metadata: {
            scroll_percentage: scrolled,
            time_spent: Date.now() - startTime.current,
            milestone: `scroll_${scrolled}%`,
          },
        });
      }
    };

    const throttledScroll = throttle(handleScroll, 1000);
    window.addEventListener('scroll', throttledScroll);
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [insightId, analytics]);

  // Track time spent when unmounting
  useEffect(() => {
    return () => {
      const timeSpent = Date.now() - startTime.current;
      
      // Only track if user spent more than 10 seconds
      if (timeSpent > 10000) {
        analytics.trackInsight({
          insight_id: insightId,
          action: 'view',
          metadata: {
            time_spent: timeSpent,
            final_scroll_percentage: scrollPercentage.current,
            completion_estimated: scrollPercentage.current > 80,
          },
        });
      }
    };
  }, [insightId, analytics]);

  // Helper functions to track specific actions
  const trackBookmark = () => {
    analytics.trackInsight({
      insight_id: insightId,
      action: 'bookmark',
      metadata: {
        time_spent: Date.now() - startTime.current,
        scroll_percentage: scrollPercentage.current,
      },
    });
  };

  const trackShare = (platform: string) => {
    analytics.trackInsight({
      insight_id: insightId,
      action: 'share',
      metadata: {
        share_platform: platform,
        time_spent: Date.now() - startTime.current,
        scroll_percentage: scrollPercentage.current,
      },
    });
  };

  const trackDownload = (downloadType: string) => {
    analytics.trackInsight({
      insight_id: insightId,
      action: 'download',
      metadata: {
        download_type: downloadType,
        time_spent: Date.now() - startTime.current,
        scroll_percentage: scrollPercentage.current,
      },
    });
  };

  const trackSearchResultClick = (searchQuery: string, position: number) => {
    analytics.trackInsight({
      insight_id: insightId,
      action: 'search_result_click',
      metadata: {
        search_query: searchQuery,
        result_position: position,
        referrer: document.referrer,
      },
    });
  };

  return {
    trackBookmark,
    trackShare,
    trackDownload,
    trackSearchResultClick,
  };
};

// Throttle utility function
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}