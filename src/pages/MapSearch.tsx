import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MapView from '@/components/MapView';
import MapFilters from '@/components/MapFilters';

const MapSearch = () => {
  const [filters, setFilters] = useState<{
    radius: number;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    propertyType?: string;
  }>({
    radius: 2,
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Encuentra propiedades <span className="text-primary">cerca de ti</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Explora propiedades disponibles en tu área con nuestro mapa interactivo
            </p>
          </div>

          <div className="grid lg:grid-cols-[350px_1fr] gap-6">
            <aside>
              <MapFilters onFiltersChange={setFilters} />
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
