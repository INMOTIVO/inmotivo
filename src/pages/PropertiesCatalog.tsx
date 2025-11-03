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
        .eq('status', 'available')
        .lte('price', 25000000); // Max price 25M

      if (filters.minPrice) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice) query = query.lte('price', Math.min(filters.maxPrice, 25000000));
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

  // Array of varied images for each property type
  const getPropertyImage = (type: string, index: number) => {
    const imageCollections: Record<string, string[]> = {
      apartment: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      ],
      house: [
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
      ],
      commercial: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80',
        'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80',
        'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80',
      ],
      warehouse: [
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
        'https://images.unsplash.com/photo-1565610222536-ef125c59da2e?w=800&q=80',
        'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
        'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&q=80',
        'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&q=80',
      ],
      studio: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
        'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80',
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&q=80',
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80',
        'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
      ],
    };

    const images = imageCollections[type] || imageCollections.apartment;
    return images[index % images.length];
  };

  const isLoading = isLoadingFilters || isLoadingProperties;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4">
          <Button
            variant="default"
            size="icon"
            onClick={() => {
              const query = searchParams.get('query');
              navigate(`/?query=${encodeURIComponent(query || '')}&showOptions=true`);
            }}
            className="mb-3 rounded-full w-12 h-12 shadow-xl bg-primary hover:bg-primary/90"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="mb-6 text-center px-4">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
              Propiedades que <span className="text-primary">coinciden</span>
              <br className="hidden sm:block" />
              <span className="sm:inline"> </span>con tu búsqueda
            </h1>
            {queryParam && (
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-primary/10 rounded-full max-w-[90%]">
              <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">Buscaste:</span>
              <span className="text-xs md:text-sm font-semibold text-primary truncate">"{queryParam}"</span>
              {filters.location && (
                <>
                  <span className="text-sm text-muted-foreground">en:</span>
                  <span className="text-sm font-semibold text-primary">{filters.location}</span>
                </>
              )}
            </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : properties && properties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {properties.map((property, index) => {
                const images = property.images as string[] || [];
                const defaultImage = getPropertyImage(property.property_type, index);
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
