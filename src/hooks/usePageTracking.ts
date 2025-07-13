import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page views for analytics
    const trackPageView = () => {
      // You can integrate with analytics services here
      if (typeof window !== 'undefined') {
        // Example for Google Analytics
        // gtag('config', 'GA_MEASUREMENT_ID', {
        //   page_path: location.pathname,
        // });
        
        // For now, just log for development
        console.log(`Page view: ${location.pathname}`);
      }
    };

    trackPageView();
  }, [location.pathname]);

  return location.pathname;
};