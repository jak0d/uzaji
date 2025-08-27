import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, isAnalyticsEnabled } from '../utils/analytics';

export function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // Track page views on route changes
    if (isAnalyticsEnabled()) {
      trackPageView(location.pathname + location.search);
    }
  }, [location]);

  return {
    isEnabled: isAnalyticsEnabled(),
  };
}