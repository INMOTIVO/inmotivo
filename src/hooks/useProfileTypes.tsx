import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ProfileType = 'owner' | 'tenant' | 'buyer';

const PENDING_PROFILE_TYPE_KEY = 'inmotivo_pending_profile_type';

export const useProfileTypes = () => {
  const { user, loading: authLoading } = useAuth();
  const [types, setTypes] = useState<ProfileType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTypes = useCallback(async () => {
    if (!user) {
      setTypes([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profile_types')
        .select('type')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const profileTypes = data?.map(r => r.type as ProfileType) || [];
      setTypes(profileTypes);
    } catch (error) {
      console.error('Error fetching profile types:', error);
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchTypes();
    }
  }, [authLoading, fetchTypes]);

  // Check for pending profile type after login
  useEffect(() => {
    const checkPendingType = async () => {
      if (!user || authLoading || loading) return;
      
      const pendingType = sessionStorage.getItem(PENDING_PROFILE_TYPE_KEY);
      if (pendingType && ['owner', 'tenant', 'buyer'].includes(pendingType)) {
        // Clear the pending type first
        sessionStorage.removeItem(PENDING_PROFILE_TYPE_KEY);
        
        // Check if user already has this type
        if (!types.includes(pendingType as ProfileType)) {
          await addType(pendingType as ProfileType);
        }
      }
    };
    
    checkPendingType();
  }, [user, authLoading, loading, types]);

  const hasType = useCallback((type: ProfileType) => types.includes(type), [types]);
  
  const isOwner = types.includes('owner');
  const isTenant = types.includes('tenant');
  const isBuyer = types.includes('buyer');

  const addType = async (type: ProfileType): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    // Check if already has this type
    if (types.includes(type)) {
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('profile_types')
        .insert({
          user_id: user.id,
          type: type
        });

      if (error) throw error;
      
      // Refresh types
      await fetchTypes();
      return { error: null };
    } catch (error) {
      console.error('Error adding profile type:', error);
      return { error: error as Error };
    }
  };

  const setPendingType = (type: ProfileType) => {
    sessionStorage.setItem(PENDING_PROFILE_TYPE_KEY, type);
  };

  const getPendingType = (): ProfileType | null => {
    const pending = sessionStorage.getItem(PENDING_PROFILE_TYPE_KEY);
    if (pending && ['owner', 'tenant', 'buyer'].includes(pending)) {
      return pending as ProfileType;
    }
    return null;
  };

  const clearPendingType = () => {
    sessionStorage.removeItem(PENDING_PROFILE_TYPE_KEY);
  };

  return {
    types,
    loading,
    hasType,
    isOwner,
    isTenant,
    isBuyer,
    addType,
    setPendingType,
    getPendingType,
    clearPendingType,
    refetch: fetchTypes
  };
};
