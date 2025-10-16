import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

const PropertiesCatalog = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get('query');
  const [filters, setFilters] = useState<any>({});
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  // Interpret search query to get filters
  useEffect(() => {
    const interpretSearch = async () => {
      if (!queryParam) {
        setIsLoadingFilters(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('interpret-search', {
          body: { query: queryParam }
        });

        if (error) throw error;

        setFilters(data?.filters || {});
      } catch (error) {
        console.error('Error interpreting search:', error);
      } finally {
        setIsLoadingFilters(false);
      }
    };

    interpretSearch();
  }, [queryParam]);

  // Fetch properties based on filters
  const { data: properties, isLoading: isLoadingProperties } = useQuery({
    queryKey: ['catalog-properties', filters],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'available');

      if (filters.minPrice) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
      if (filters.bedrooms) query = query.gte('bedrooms', filters.bedrooms);
      if (filters.propertyType) query = query.eq('property_type', filters.propertyType);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !isLoadingFilters,
  });

  const propertyTypes: Record<string, string> = {
    apartment: 'Apartamento',
    house: 'Casa',
    commercial: 'Local',
    warehouse: 'Bodega',
    studio: 'Apartaestudio',
  };

  const defaultImages: Record<string, string> = {
    apartment: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    house: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
    commercial: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    warehouse: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    studio: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  };

  const isLoading = isLoadingFilters || isLoadingProperties;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Propiedades que coinciden con tu búsqueda
            </h1>
            {queryParam && (
              <p className="text-xl text-muted-foreground">
                "{queryParam}"
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : properties && properties.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property) => {
                const images = property.images as string[] || [];
                const defaultImage = defaultImages[property.property_type] || defaultImages.apartment;
                return (
                  <PropertyCard
                    key={property.id}
                    id={property.id}
                    title={property.title}
                    price={`$${property.price.toLocaleString()}`}
                    location={`${property.neighborhood}, ${property.city}`}
                    beds={property.bedrooms}
                    baths={property.bathrooms}
                    area={`${property.area_m2} m²`}
                    imageUrl={images[0] || defaultImage}
                    type={propertyTypes[property.property_type] || property.property_type}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground mb-4">
                No encontramos propiedades que coincidan con tu búsqueda
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                Volver al inicio
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PropertiesCatalog;
