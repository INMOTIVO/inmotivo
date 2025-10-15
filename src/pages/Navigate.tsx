import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import NavigationMap from '@/components/NavigationMap';
import NavigationControls from '@/components/NavigationControls';
import NearbyProperties from '@/components/NearbyProperties';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navigate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState('');
  const [filters, setFilters] = useState<any>({});

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
            <NavigationControls onStartNavigation={handleStartNavigation} />
          </div>
        ) : (
          <div className="relative h-[calc(100vh-5rem)]">
            <NavigationMap
              destination={destination!}
              filters={filters}
              onStopNavigation={handleStopNavigation}
            />
            <NearbyProperties filters={filters} searchCriteria={searchCriteria} />
          </div>
        )}
      </main>
      {!isNavigating && <Footer />}
    </div>
  );
};

export default Navigate;
