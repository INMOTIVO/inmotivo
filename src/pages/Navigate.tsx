import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import NavigationMap from '@/components/NavigationMap';
import NavigationControls from '@/components/NavigationControls';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Navigate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get direct navigation params first
  const destLat = searchParams.get('destLat');
  const destLng = searchParams.get('destLng');
  const destName = searchParams.get('destName');
  const isDirectNavigation = !!(destLat && destLng); // Flag for direct property navigation
  
  // Initialize destination and isNavigating immediately if direct navigation
  const [destination, setDestination] = useState<[number, number] | null>(() => {
    if (destLat && destLng) {
      const lat = parseFloat(destLat);
      const lng = parseFloat(destLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }
    return null;
  });
  
  const [isNavigating, setIsNavigating] = useState(isDirectNavigation);
  const [searchCriteria, setSearchCriteria] = useState(destName || '');
  const [filters, setFilters] = useState<any>({});
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Get initial query from URL params
  const initialQuery = searchParams.get('query') || '';
  const autoStart = searchParams.get('autostart') === 'true';

  // No longer needed - direct navigation is initialized in useState

  // Auto-start navigation if autostart param is present
  useEffect(() => {
    if (autoStart && initialQuery && !isNavigating && !isInitializing && !destLat && !destLng) {
      setIsInitializing(true);
      startAutoNavigation();
    }
  }, [autoStart, initialQuery, destLat, destLng]);

  // Listen for query changes and re-interpret search while navigating
  useEffect(() => {
    const currentQuery = searchParams.get('query') || '';
    
    // Only re-interpret if navigating and query changed
    if (isNavigating && currentQuery && currentQuery !== searchCriteria) {
      const reinterpretSearch = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('interpret-search', {
            body: { query: currentQuery }
          });

          if (error) {
            console.error('Error re-interpreting search:', error);
            return;
          }

          if (data?.error === 'invalid_query') {
            toast.error(data.message || 'Por favor describe mejor qué buscas');
            return;
          }

          const interpretedFilters = data?.filters || {};
          
          // Update filters and search criteria
          setSearchCriteria(currentQuery);
          setFilters(interpretedFilters);
          toast.success('Búsqueda actualizada');
        } catch (error) {
          console.error('Error:', error);
          toast.error('Error al actualizar la búsqueda');
        }
      };

      reinterpretSearch();
    }
  }, [searchParams, isNavigating]);

  const startAutoNavigation = async () => {
    try {
      // Get user's current location
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];

          // Interpret search to get filters
          const { data, error } = await supabase.functions.invoke('interpret-search', {
            body: { query: initialQuery }
          });

          if (error instanceof FunctionsHttpError) {
            const errorData = await error.context.json();
            if (errorData?.error === 'invalid_query') {
              toast.error(errorData.message || 'Por favor describe mejor qué buscas', {
                duration: 5000,
                description: "💡 Ejemplo: 'Apartamento de 2 habitaciones cerca del metro'"
              });
              setIsInitializing(false);
              return;
            }
          }

          if (error) throw error;

          // También manejar respuesta inválida con 200
          if (data?.error === 'invalid_query') {
            toast.error(data.message || 'Por favor describe mejor qué buscas', {
              duration: 5000,
              description: data.suggestion || "💡 Ejemplo: 'Apartamento de 2 habitaciones cerca del metro'"
            });
            setIsInitializing(false);
            return;
          }

          const interpretedFilters = data?.filters || {};
          
          // Use user's location as destination (they will discover properties while moving)
          setDestination(userLocation);
          setSearchCriteria(initialQuery);
          setFilters(interpretedFilters);
          setIsNavigating(true);
          setIsInitializing(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('No se pudo obtener tu ubicación');
          setIsInitializing(false);
        }
      );
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al iniciar la navegación');
      setIsInitializing(false);
    }
  };

  const handleStartNavigation = (dest: [number, number], criteria: string, appliedFilters: any) => {
    setDestination(dest);
    setSearchCriteria(criteria);
    setFilters(appliedFilters);
    setIsNavigating(true);
  };

  const handleStopNavigation = () => {
    // If in direct navigation, switch to GPS mode instead of stopping
    if (isDirectNavigation) {
      // Remove direct navigation params and stay in GPS mode
      navigate('/navegacion?query=Propiedades%20cerca');
      return;
    }
    
    setIsNavigating(false);
    setDestination(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h2 className="text-2xl font-bold">Iniciando navegación GPS...</h2>
            <p className="text-muted-foreground">Obteniendo tu ubicación</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={`flex-1 ${!isNavigating ? 'pt-20' : ''}`}>
        {!isNavigating ? (
          <div className="container mx-auto px-4 py-8">
            <Button
              variant="default"
              size="icon"
              onClick={() => navigate('/mapa')}
              className="mb-4 rounded-full w-12 h-12 shadow-xl bg-primary hover:bg-primary/90"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <NavigationControls 
              onStartNavigation={handleStartNavigation}
              initialCriteria={initialQuery}
            />
          </div>
        ) : (
          <div className="relative h-screen">
            <Button
              variant="default"
              size="icon"
              onClick={() => {
                const query = searchParams.get('query');
                navigate(`/?query=${encodeURIComponent(query || '')}&showOptions=true`);
              }}
              className="absolute top-24 left-6 z-[9999] shadow-xl bg-primary hover:bg-primary/90 rounded-full w-12 h-12"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <NavigationMap
              destination={destination!}
              filters={filters}
              onStopNavigation={handleStopNavigation}
              searchCriteria={searchCriteria}
              isDirectNavigation={isDirectNavigation}
            />
          </div>
        )}
      </main>
      {!isNavigating && <Footer />}
    </div>
  );
};

export default Navigate;
