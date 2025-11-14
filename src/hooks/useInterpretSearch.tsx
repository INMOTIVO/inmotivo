import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface InterpretSearchResult {
  // ⬅️ Nuevos campos que pueden venir del backend
  location?: string | null;
  locationText?: string | null;

  parsed?: {
    location?: string | null;
    [key: string]: any;
  };

  filters: {
    radius?: number;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    propertyType?: string;
    location?: string | null; // ⬅️ por si viene dentro de filters
    [key: string]: any;
  };

  // Permitir cualquier otra estructura sin marcar error
  [key: string]: any;
}

interface CacheEntry {
  data: InterpretSearchResult;
  timestamp: number;
}

// Caché global compartido entre todas las instancias del hook
const searchCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useInterpretSearch = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const interpretSearch = useCallback(async (query: string): Promise<InterpretSearchResult | null> => {
    if (!query.trim()) {
      toast.error("Por favor describe qué buscas");
      return null;
    }

    const trimmedQuery = query.trim().toLowerCase();
    
    // Verificar caché
    const cached = searchCache.get(trimmedQuery);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Using cached search result');
      return cached.data;
    }

    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsProcessing(true);

try {
  // ⏳ Timeout máximo de 7 segundos
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  const { data, error } = await supabase.functions.invoke('interpret-search', {
    body: { query: trimmedQuery },
    signal: controller.signal, // 👈 Forzamos cancelación si tarda mucho
  }).finally(() => clearTimeout(timeout));

  if (error instanceof FunctionsHttpError) {
    const errorData = await error.context.json();
    if (errorData?.error === 'invalid_query') {
      toast.error(errorData.message || 'Por favor describe mejor qué buscas', {
        duration: 5000,
        description: errorData.suggestion || "💡 Ejemplo: 'Apartamento de 2 habitaciones cerca del metro'",
      });
      return null;
    }
  }

  if (error) throw error;
  if (!data) {
    toast.error('Sin respuesta del servidor. Intenta de nuevo.');
    return null;
  }

  if (data?.error === 'invalid_query') {
    toast.error(data.message || 'Por favor describe mejor qué buscas', {
      duration: 5000,
      description: data.suggestion || "💡 Ejemplo: 'Apartamento de 2 habitaciones cerca del metro'",
    });
    return null;
  }

  const result: InterpretSearchResult = { filters: data?.filters || {} };

  searchCache.set(trimmedQuery, {
    data: result,
    timestamp: Date.now(),
  });

  return result;
} catch (error: any) {
  if (error.name === 'AbortError') {
    toast.error('La búsqueda tardó demasiado (timeout)');
    console.warn('🕒 Interpret-search abortado por timeout');
    return null;
  }
  console.error('Error interpreting search:', error);
  toast.error('Error al procesar la búsqueda');
  return null;
} finally {
  setIsProcessing(false);
  abortControllerRef.current = null;
}

  }, []);

  return { interpretSearch, isProcessing };
};
