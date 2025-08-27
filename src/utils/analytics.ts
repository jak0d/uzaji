// Google Analytics utility functions
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID || '';

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (!GA_TRACKING_ID || !window.gtag) return;

  window.gtag('config', GA_TRACKING_ID, {
    page_path: path,
    page_title: title || document.title,
  });
};

// Track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (!GA_TRACKING_ID || !window.gtag) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Track user authentication events
export const trackAuth = (action: 'login' | 'signup' | 'logout', method?: string) => {
  trackEvent(action, 'authentication', method);
};

// Track business events
export const trackBusiness = (action: string, label?: string, value?: number) => {
  trackEvent(action, 'business', label, value);
};

// Track navigation events
export const trackNavigation = (action: string, destination: string) => {
  trackEvent(action, 'navigation', destination);
};

// Track feature usage
export const trackFeature = (feature: string, action: string, label?: string) => {
  trackEvent(action, `feature_${feature}`, label);
};

// Track errors (privacy-safe)
export const trackError = (error: string, category: string = 'error') => {
  // Only track error types, not sensitive data
  const sanitizedError = error.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
                              .replace(/\b\d{4,}\b/g, '[number]')
                              .replace(/['"]/g, '');
  
  trackEvent('error', category, sanitizedError);
};

// Check if analytics is enabled (respects user privacy settings)
export const isAnalyticsEnabled = (): boolean => {
  // Check for Do Not Track setting
  if (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes') {
    return false;
  }
  
  return !!GA_TRACKING_ID;
};