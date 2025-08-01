// Analytics utilities for tracking user interactions
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  user_id?: string;
  session_id?: string;
  page_url?: string;
  user_agent?: string;
}

export interface InsightAnalytics {
  insight_id: string;
  action: 'view' | 'bookmark' | 'share' | 'download' | 'search_result_click';
  metadata?: {
    reading_time?: number;
    scroll_percentage?: number;
    time_spent?: number;
    search_query?: string;
    share_platform?: string;
    referrer?: string;
  };
}

export interface EpisodeAnalytics {
  episode_id: string;
  action: 'view' | 'play' | 'pause' | 'complete' | 'bookmark' | 'share' | 'search_result_click';
  metadata?: {
    play_time?: number;
    current_time?: number;
    duration?: number;
    completion_percentage?: number;
    search_query?: string;
    share_platform?: string;
    referrer?: string;
  };
}

class AnalyticsManager {
  private sessionId: string;
  private userId: string | null = null;
  private events: AnalyticsEvent[] = [];
  private flushInterval: number = 30000; // 30 seconds
  private maxBatchSize: number = 50;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeUser();
    this.startPeriodicFlush();
    this.setupEventListeners();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      this.userId = user?.id || null;
    } catch (error) {
      console.warn('Analytics: Could not get user info', error);
    }
  }

  private setupEventListeners() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush(); // Flush events when page becomes hidden
      }
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  private startPeriodicFlush() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  // Generic event tracking
  track(eventType: string, eventData?: Record<string, any>) {
    if (!this.shouldTrack()) return;

    const event: AnalyticsEvent = {
      event_type: eventType,
      event_data: eventData,
      user_id: this.userId,
      session_id: this.sessionId,
      page_url: window.location.href,
      user_agent: navigator.userAgent,
    };

    this.events.push(event);

    // Auto-flush if batch size exceeded
    if (this.events.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  // Track insight interactions
  trackInsight(analytics: InsightAnalytics) {
    this.track('insight_interaction', {
      insight_id: analytics.insight_id,
      action: analytics.action,
      ...analytics.metadata,
    });
  }

  // Track episode interactions
  trackEpisode(analytics: EpisodeAnalytics) {
    this.track('episode_interaction', {
      episode_id: analytics.episode_id,
      action: analytics.action,
      ...analytics.metadata,
    });
  }

  // Track search interactions
  trackSearch(query: string, resultCount: number, resultType?: string, clickedResult?: { id: string; type: string; position: number }) {
    this.track('search', {
      query,
      result_count: resultCount,
      result_type: resultType,
      clicked_result: clickedResult,
    });
  }

  // Track performance metrics
  trackPerformance(metrics: {
    page_load_time?: number;
    time_to_interactive?: number;
    largest_contentful_paint?: number;
    first_input_delay?: number;
    cumulative_layout_shift?: number;
  }) {
    this.track('performance', metrics);
  }

  // Track user engagement
  trackEngagement(type: 'page_view' | 'scroll' | 'time_on_page', data?: Record<string, any>) {
    this.track('engagement', {
      engagement_type: type,
      ...data,
    });
  }

  // Check if tracking is enabled (respects user consent)
  private shouldTrack(): boolean {
    // Check for cookie consent
    const cookieConsent = document.cookie
      .split('; ')
      .find(row => row.startsWith('cookieConsent='));
    
    return cookieConsent?.split('=')[1] === 'true';
  }

  // Flush events to the server
  private async flush() {
    if (this.events.length === 0) return;

    const eventsToFlush = [...this.events];
    this.events = [];

    try {
      // Store in Supabase - we'll create a generic analytics table
      const { error } = await supabase
        .from('analytics_events')
        .insert(eventsToFlush.map(event => ({
          event_type: event.event_type,
          event_data: event.event_data,
          user_id: event.user_id,
          session_id: event.session_id,
          page_url: event.page_url,
          user_agent: event.user_agent,
          created_at: new Date().toISOString(),
        })));

      if (error) {
        console.warn('Analytics: Failed to flush events', error);
        // Put events back in queue on failure
        this.events.unshift(...eventsToFlush);
      }
    } catch (error) {
      console.warn('Analytics: Error flushing events', error);
      // Put events back in queue on failure
      this.events.unshift(...eventsToFlush);
    }
  }

  // Force flush (useful for testing or immediate tracking)
  forceFlush() {
    return this.flush();
  }
}

// Singleton instance
export const analytics = new AnalyticsManager();

// Hook for React components
export const useAnalytics = () => {
  return {
    track: analytics.track.bind(analytics),
    trackInsight: analytics.trackInsight.bind(analytics),
    trackEpisode: analytics.trackEpisode.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackEngagement: analytics.trackEngagement.bind(analytics),
    flush: analytics.forceFlush.bind(analytics),
  };
};

// Utility functions for common tracking patterns
export const trackPageView = (page: string, additionalData?: Record<string, any>) => {
  analytics.trackEngagement('page_view', {
    page,
    timestamp: Date.now(),
    ...additionalData,
  });
};

export const trackTimeOnPage = (startTime: number, page: string) => {
  const timeSpent = Date.now() - startTime;
  analytics.trackEngagement('time_on_page', {
    page,
    time_spent: timeSpent,
    timestamp: Date.now(),
  });
};

export const trackScrollDepth = (percentage: number, page: string) => {
  analytics.trackEngagement('scroll', {
    page,
    scroll_percentage: percentage,
    timestamp: Date.now(),
  });
};

// Performance tracking utilities
export const trackWebVitals = () => {
  // Track Core Web Vitals if available
  if ('performance' in window) {
    // Track page load time
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      analytics.trackPerformance({
        page_load_time: loadTime,
      });
    });

    // Track navigation timing if available
    if ('getEntriesByType' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
          if (navigationEntries.length > 0) {
            const entry = navigationEntries[0];
            analytics.trackPerformance({
              time_to_interactive: entry.domInteractive - entry.fetchStart,
              page_load_time: entry.loadEventEnd - entry.fetchStart,
            });
          }
        }, 0);
      });
    }
  }
};

// Initialize performance tracking
if (typeof window !== 'undefined') {
  trackWebVitals();
}