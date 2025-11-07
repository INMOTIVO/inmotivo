import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook to track page views in the application
 * Automatically logs page visits to the page_views table
 */
export const usePageTracking = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        // Get session ID from sessionStorage or create a new one
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem('session_id', sessionId);
        }

        const { error } = await (supabase as any)
          .from('page_views')
          .insert({
            page_path: location.pathname,
            user_id: user?.id || null,
            session_id: sessionId,
            user_agent: navigator.userAgent,
            referrer: document.referrer || null,
          });

        if (error) {
          console.error('Error tracking page view:', error);
        }
      } catch (error) {
        console.error('Error in page tracking:', error);
      }
    };

    trackPageView();
  }, [location.pathname, user?.id]);
};
