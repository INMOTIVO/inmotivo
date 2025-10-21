import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import NavigationMap from '@/components/NavigationMap';
import NavigationControls from '@/components/NavigationControls';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Navigate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Get initial query from URL params
  const initialQuery = searchParams.get('query') || '';
  const autoStart = searchParams.get('autostart') === 'true';

  // Auto-start navigation if autostart param is present
  useEffect(() => {
    if (autoStart && initialQuery && !isNavigating && !isInitializing) {
      setIsInitializing(true);
      startAutoNavigation();
    }
  }, [autoStart, initialQuery]);

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

          if (error) throw error;

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
      <main className="flex-1 pt-20">
        {!isNavigating ? (
          <div className="container mx-auto px-4 py-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/mapa')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al mapa
            </Button>
            <NavigationControls 
              onStartNavigation={handleStartNavigation}
              initialCriteria={initialQuery}
            />
          </div>
        ) : (
          <div className="relative h-[calc(100vh-5rem)]">
            <NavigationMap
              destination={destination!}
              filters={filters}
              onStopNavigation={handleStopNavigation}
              searchCriteria={searchCriteria}
            />
          </div>
        )}
      </main>
      {!isNavigating && <Footer />}
    </div>
  );
};

export default Navigate;
