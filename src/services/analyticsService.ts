// Firebase Analytics service
import { analytics } from '../config/firebase';
import { logEvent, setUserProperties } from 'firebase/analytics';

// Check if we're in a Chrome extension environment
const isExtension = typeof chrome !== 'undefined' && chrome.runtime;

// Helper function for analytics tracking with fallback logging
const trackEvent = (eventName: string, parameters?: { [key: string]: any }) => {
  if (!analytics) {
    if (isExtension) {
      console.log(`[Analytics] ${eventName}${parameters ? ` - ${JSON.stringify(parameters)}` : ''}`);
    }
    return;
  }
  
  try {
    logEvent(analytics, eventName, parameters);
  } catch (error) {
    console.warn(`Analytics ${eventName} tracking failed:`, error);
    if (isExtension) {
      console.log(`[Analytics Fallback] ${eventName}${parameters ? ` - ${JSON.stringify(parameters)}` : ''}`);
    }
  }
};

export const analyticsService = {
  // Track user login
  trackLogin: (method: string = 'google') => {
    trackEvent('login', { method });
  },

  // Track user signup
  trackSignUp: (method: string = 'email') => {
    trackEvent('sign_up', { method });
  },

  // Track note creation
  trackNoteCreated: () => {
    trackEvent('note_created');
  },

  // Track note updated
  trackNoteUpdated: () => {
    trackEvent('note_updated');
  },

  // Track note deleted
  trackNoteDeleted: () => {
    trackEvent('note_deleted');
  },

  // Track search usage
  trackSearch: (query: string) => {
    trackEvent('search', {
      search_term: query.length > 0 ? 'has_query' : 'empty_query'
    });
  },

  // Track color change
  trackColorChange: (color: string) => {
    trackEvent('note_color_changed', { color });
  },

  // Track note pin/unpin
  trackNotePinned: (isPinned: boolean) => {
    trackEvent('note_pinned', {
      action: isPinned ? 'pinned' : 'unpinned'
    });
  },

  // Set user properties
  setUserProperties: (properties: { [key: string]: string }) => {
    if (!analytics) {
      if (isExtension) {
        console.log(`[Analytics] User properties set: ${JSON.stringify(properties)}`);
      }
      return;
    }
    
    try {
      setUserProperties(analytics, properties);
    } catch (error) {
      console.warn('Analytics user properties failed:', error);
      if (isExtension) {
        console.log(`[Analytics Fallback] User properties set: ${JSON.stringify(properties)}`);
      }
    }
  },

  // Track custom events
  trackCustomEvent: (eventName: string, parameters?: { [key: string]: any }) => {
    trackEvent(eventName, parameters);
  }
};