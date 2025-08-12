import { useCallback, useRef } from 'react';
import { StartHereAnalyticsEvent } from '../types/analytics';
import { supabase } from '@/integrations/supabase/client';

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('ft_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('ft_session_id', sessionId);
  }
  return sessionId;
};

export const useStartHereAnalytics = () => {
  const sessionId = useRef(getSessionId());
  
  const trackEvent = useCallback(async (
    eventType: StartHereAnalyticsEvent['event_type'],
    eventData: Record<string, any> = {},
    pathId?: string
  ) => {
    try {
      const analyticsEvent: Omit<StartHereAnalyticsEvent, 'timestamp'> = {
        event_type: eventType,
        event_data: {
          ...eventData,
          user_agent: navigator.userAgent,
          screen_resolution: `${window.screen.width}x${window.screen.height}`,
          viewport_size: `${window.innerWidth}x${window.innerHeight}`,
          timestamp_local: new Date().toISOString()
        },
        path_id: pathId,
        session_id: sessionId.current,
        user_agent: navigator.userAgent,
        referrer: document.referrer || undefined,
        page_url: window.location.href
      };

      // Google Analytics 4 tracking
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventType, {
          event_category: 'start_here',
          event_label: pathId || 'general',
          session_id: sessionId.current,
          path_id: pathId,
          ...eventData
        });
      }

      // Database logging for detailed analysis (non-blocking)
      const { data: { user } } = await supabase.auth.getUser();
      
      const dbEvent = {
        ...analyticsEvent,
        user_id: user?.id || null,
        timestamp: new Date().toISOString()
      };

      // Insert without waiting for response to avoid blocking UI
      supabase
        .from('start_here_analytics')
        .insert(dbEvent)
        .then(({ error }) => {
          if (error) {
            console.warn('Analytics logging failed:', error);
          }
        });

    } catch (error) {
      console.warn('Analytics tracking error:', error);
    }
  }, []);

  // Specific event tracking methods for common use cases
  const trackSectionViewed = useCallback((variant?: string) => {
    trackEvent('section_viewed', { 
      variant: variant || 'default',
      viewport_above_fold: window.scrollY < window.innerHeight 
    });
  }, [trackEvent]);

  const trackPathCardHovered = useCallback((pathId: string, duration: number) => {
    trackEvent('path_card_hovered', { pathId, duration });
  }, [trackEvent]);

  const trackPathSelected = useCallback((pathId: string, previousPath?: string) => {
    trackEvent('path_selected', { 
      pathId, 
      previousPath,
      selection_time: Date.now() 
    }, pathId);
  }, [trackEvent]);

  const trackJourneyStarted = useCallback((pathId: string, source?: string) => {
    trackEvent('journey_started', { 
      pathId, 
      source: source || 'path_card',
      start_time: Date.now() 
    }, pathId);
  }, [trackEvent]);

  const trackStepCompleted = useCallback((
    pathId: string, 
    stepId: string, 
    timeSpent: number,
    response?: any
  ) => {
    trackEvent('step_completed', { 
      pathId, 
      stepId, 
      timeSpent,
      response_type: typeof response,
      has_response: !!response 
    }, pathId);
  }, [trackEvent]);

  const trackStepSkipped = useCallback((pathId: string, stepId: string, reason?: string) => {
    trackEvent('step_skipped', { 
      pathId, 
      stepId, 
      skip_reason: reason || 'user_choice' 
    }, pathId);
  }, [trackEvent]);

  const trackJourneyCompleted = useCallback((
    pathId: string, 
    totalTime: number,
    completedSteps: number,
    totalSteps: number
  ) => {
    trackEvent('journey_completed', { 
      pathId, 
      totalTime,
      completedSteps,
      totalSteps,
      completion_rate: (completedSteps / totalSteps) * 100 
    }, pathId);
  }, [trackEvent]);

  const trackJourneyAbandoned = useCallback((
    pathId: string, 
    lastStep: string, 
    reason?: string,
    timeSpent?: number
  ) => {
    trackEvent('journey_abandoned', { 
      pathId, 
      lastStep, 
      abandon_reason: reason || 'unknown',
      timeSpent: timeSpent || 0 
    }, pathId);
  }, [trackEvent]);

  const trackEmailCaptured = useCallback((
    pathId: string, 
    source: string,
    email?: string
  ) => {
    trackEvent('email_captured', { 
      pathId, 
      source,
      has_email: !!email,
      capture_time: Date.now() 
    }, pathId);
  }, [trackEvent]);

  const trackContentInteraction = useCallback((
    contentId: string,
    contentType: 'episode' | 'insight' | 'memo',
    action: 'viewed' | 'played' | 'downloaded' | 'shared',
    pathId?: string
  ) => {
    const eventType = action === 'played' ? 'episode_played' : 
                     action === 'downloaded' ? 'content_downloaded' : 
                     'recommendation_clicked';
    
    trackEvent(eventType, { 
      contentId, 
      contentType, 
      action,
      interaction_time: Date.now() 
    }, pathId);
  }, [trackEvent]);

  const trackRecommendationClicked = useCallback((
    contentId: string,
    position: number,
    pathId?: string,
    recommendationType?: 'ai' | 'curated' | 'popular'
  ) => {
    trackEvent('recommendation_clicked', { 
      contentId, 
      position,
      recommendationType: recommendationType || 'curated',
      click_time: Date.now() 
    }, pathId);
  }, [trackEvent]);

  const trackTrustSignalInteraction = useCallback((
    signalType: 'company_logo' | 'testimonial' | 'statistic' | 'social_proof',
    signalId: string,
    action: 'viewed' | 'clicked' | 'hovered'
  ) => {
    const eventType = action === 'clicked' ? 'social_proof_clicked' : 'trust_signal_viewed';
    
    trackEvent(eventType, { 
      signalType, 
      signalId, 
      action,
      interaction_time: Date.now() 
    });
  }, [trackEvent]);

  return {
    // Core tracking function
    trackEvent,
    
    // Specific event trackers
    trackSectionViewed,
    trackPathCardHovered,
    trackPathSelected,
    trackJourneyStarted,
    trackStepCompleted,
    trackStepSkipped,
    trackJourneyCompleted,
    trackJourneyAbandoned,
    trackEmailCaptured,
    trackContentInteraction,
    trackRecommendationClicked,
    trackTrustSignalInteraction,
    
    // Session information
    sessionId: sessionId.current
  };
};