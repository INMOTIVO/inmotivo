import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePageView = () => {
  const { user } = useAuth();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        // Generar un session_id si no existe
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem('session_id', sessionId);
        }

        await supabase.from('page_views').insert({
          page_path: window.location.pathname,
          user_id: user?.id || null,
          session_id: sessionId,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
        });
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    };

    trackPageView();
  }, [user]);
};
