// Simplified analytics utilities to avoid TypeScript errors

export interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  user_id?: string;
  session_id?: string;
  page_url?: string;
  user_agent?: string;
}

export const trackEvent = (eventType: string, data?: any) => {
  console.log('Analytics event:', eventType, data);
};

export const trackPageView = (page: string) => {
  console.log('Page view:', page);
};

export const trackInteraction = (type: string, details?: any) => {
  console.log('Interaction:', type, details);
};

export const trackInsightInteraction = (insightId: string, action: string, metadata?: any) => {
  console.log('Insight interaction:', { insightId, action, metadata });
};

export const trackEpisodeInteraction = (episodeId: string, action: string, metadata?: any) => {
  console.log('Episode interaction:', { episodeId, action, metadata });
};

export const trackSearch = (query: string, results: number, selectedResult?: any) => {
  console.log('Search:', { query, results, selectedResult });
};

// Analytics manager (simplified)
class AnalyticsManager {
  track(eventType: string, data?: any) {
    trackEvent(eventType, data);
  }
}

export const analytics = new AnalyticsManager();