import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

const RECOVERY_MODE_KEY = 'inmotivo_password_recovery_mode';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // LAYER 1: Check sessionStorage for persisted recovery mode
    const storedRecoveryMode = sessionStorage.getItem(RECOVERY_MODE_KEY);
    if (storedRecoveryMode === 'true') {
      console.log('🔑 Recovery mode detected from sessionStorage');
      setIsPasswordRecovery(true);
    }

    // LAYER 2: Check URL params for mode=recovery
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode === 'recovery') {
      console.log('🔑 Recovery mode detected from URL param');
      sessionStorage.setItem(RECOVERY_MODE_KEY, 'true');
      setIsPasswordRecovery(true);
    }

    // LAYER 3: Check hash for recovery tokens (Supabase uses hash for tokens)
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.replace('#', ''));
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      
      if (type === 'recovery' || (accessToken && type === 'recovery')) {
        console.log('🔑 Recovery mode detected from URL hash');
        sessionStorage.setItem(RECOVERY_MODE_KEY, 'true');
        setIsPasswordRecovery(true);
      }
    }

    // LAYER 4: Set up auth state listener to detect PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth event:', event);
        
        // Detect PASSWORD_RECOVERY event
        if (event === 'PASSWORD_RECOVERY') {
          console.log('🔑 PASSWORD_RECOVERY event received');
          sessionStorage.setItem(RECOVERY_MODE_KEY, 'true');
          setIsPasswordRecovery(true);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, userType: string = 'tenant') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          user_type: userType
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    // Clear recovery mode on sign out
    sessionStorage.removeItem(RECOVERY_MODE_KEY);
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?mode=recovery`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (!error) {
      // Clear recovery mode after successful password update
      sessionStorage.removeItem(RECOVERY_MODE_KEY);
      setIsPasswordRecovery(false);
      
      // Clean up URL params
      const url = new URL(window.location.href);
      url.searchParams.delete('mode');
      url.hash = '';
      window.history.replaceState({}, '', url.pathname);
    }
    
    return { error };
  };

  const clearPasswordRecoveryMode = () => {
    sessionStorage.removeItem(RECOVERY_MODE_KEY);
    setIsPasswordRecovery(false);
  };

  return {
    user,
    session,
    loading,
    isPasswordRecovery,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    clearPasswordRecoveryMode,
  };
};
