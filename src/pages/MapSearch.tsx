import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MapView from '@/components/MapView';
import MapFilters from '@/components/MapFilters';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const MapSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const typeParam = searchParams.get('type');
  const queryParam = searchParams.get('query');
  const listingTypeParam = searchParams.get('listingType') || 'rent';
  
  const [filters, setFilters] = useState<{
    radius: number;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    propertyType?: string;
    listingType?: 'rent' | 'sale';
  }>({
    radius: 2,
    propertyType: typeParam || undefined,
    listingType: listingTypeParam as 'rent' | 'sale',
  });

  useEffect(() => {
    if (typeParam) {
      setFilters(prev => ({ ...prev, propertyType: typeParam }));
    }
  }, [typeParam]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16 md:pt-24 pb-12">
        <div className="container mx-auto px-4">
          <Button
            variant="default"
            size="icon"
            onClick={() => navigate(-1)}
            className="mb-4 rounded-full w-12 h-12 shadow-xl bg-primary hover:bg-primary/90"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="mb-6 md:mb-8 text-center px-4">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4">
              Encuentra propiedades <span className="text-primary">cerca de ti</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Explora propiedades disponibles en tu área con nuestro mapa interactivo
            </p>
          </div>

          <div className="grid lg:grid-cols-[350px_1fr] gap-6">
            <aside>
              <MapFilters 
                onFiltersChange={setFilters}
                initialQuery={queryParam || undefined}
              />
            </aside>
            <div>
              <MapView radius={filters.radius} filters={filters} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MapSearch;
