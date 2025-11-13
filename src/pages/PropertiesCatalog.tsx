import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, Edit2, Search, X } from 'lucide-react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

const PropertiesCatalog = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get('query');
  const listingTypeParam = searchParams.get('listingType') || 'rent';
  const userLat = searchParams.get('lat');
  const userLng = searchParams.get('lng');
  const radius = searchParams.get('radius');
  const [filters, setFilters] = useState<any>({});
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isEditingQuery, setIsEditingQuery] = useState(false);
  const [editedQuery, setEditedQuery] = useState(queryParam || '');

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

        if (error instanceof FunctionsHttpError) {
          const errorData = await error.context.json();
          if (errorData?.error === 'invalid_query') {
            toast.error(errorData.message || 'Por favor describe mejor qué buscas', {
              duration: 5000,
              description: "💡 Ejemplo: 'Apartamento de 2 habitaciones cerca del metro'"
            });
            setFilters({});
            setIsLoadingFilters(false);
            return;
          }
        }

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

  // Obtener todos los favoritos del usuario en una sola consulta
  const { data: favorites } = useQuery({
    queryKey: ["user-favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("property_favorites")
        .select("property_id")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data.map(f => f.property_id);
    },
    enabled: !!user,
  });

  // Fetch properties based on filters
  const { data: properties, isLoading: isLoadingProperties } = useQuery({
    queryKey: ['catalog-properties', filters, userLat, userLng, radius, listingTypeParam],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .eq('listing_type', listingTypeParam)
        .lte('price', 25000000); // Max price 25M

      if (filters.minPrice) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice) query = query.lte('price', Math.min(filters.maxPrice, 25000000));
      if (filters.bedrooms) query = query.gte('bedrooms', filters.bedrooms);
      if (filters.propertyType) query = query.eq('property_type', filters.propertyType);

      // Filter by location name if provided (and no GPS coordinates)
      if (filters.location && !userLat && !userLng) {
        const locationLower = filters.location.toLowerCase();
        // Extract the first meaningful word (usually the city name)
        const cityName = locationLower.split(/[\s,]+/)[0]; // Split by spaces or commas and get first word
        query = query.or(`city.ilike.%${cityName}%,neighborhood.ilike.%${locationLower}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      // Filter by distance if GPS location parameters are provided
      if (userLat && userLng && radius && data) {
        const lat = parseFloat(userLat);
        const lng = parseFloat(userLng);
        const maxRadius = parseFloat(radius);
        
        const filtered = data.filter(property => {
          if (!property.latitude || !property.longitude) return false;
          const distance = calculateDistance(
            lat, 
            lng, 
            Number(property.latitude), 
            Number(property.longitude)
          );
          return distance <= maxRadius;
        });
        
        // Sort by distance (closest first)
        filtered.sort((a, b) => {
          const distA = calculateDistance(lat, lng, Number(a.latitude), Number(a.longitude));
          const distB = calculateDistance(lat, lng, Number(b.latitude), Number(b.longitude));
          return distA - distB;
        });
        
        return filtered;
      }
      
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

  const handleEditQuery = () => {
    setEditedQuery(queryParam || '');
    setIsEditingQuery(true);
  };

  const handleCancelEdit = () => {
    setIsEditingQuery(false);
    setEditedQuery(queryParam || '');
  };

  const handleSaveQuery = () => {
    if (editedQuery.trim()) {
      const params = new URLSearchParams();
      params.set('query', editedQuery.trim());
      if (userLat) params.set('lat', userLat);
      if (userLng) params.set('lng', userLng);
      if (radius) params.set('radius', radius);
      navigate(`/catalogo?${params.toString()}`);
      setIsEditingQuery(false);
      toast.success('Búsqueda actualizada');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveQuery();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4">
          <Button
            variant="default"
            size="icon"
            onClick={() => navigate('/')}
            className="mb-3 rounded-full w-12 h-12 shadow-xl bg-primary hover:bg-primary/90"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="mb-6 text-center px-4">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
              Propiedades para <span className="text-primary">{listingTypeParam === 'rent' ? 'arrendar' : 'comprar'}</span>
              <br className="hidden sm:block" />
              <span className="sm:inline"> </span>que coinciden con tu búsqueda
              {userLat && userLng && radius && (
                <span className="block text-lg md:text-xl text-muted-foreground mt-2">
                  a máximo {parseFloat(radius) / 1000} km de tu ubicación
                </span>
              )}
              {!userLat && !userLng && filters.location && (
                <span className="block text-lg md:text-xl text-muted-foreground mt-2">
                  en {filters.location}
                </span>
              )}
            </h1>
            {queryParam && (
              <div className="w-full max-w-2xl mx-auto">
                {isEditingQuery ? (
                  <div className="bg-card border-2 border-primary rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Search className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm font-semibold text-foreground">Modificar búsqueda</span>
                    </div>
                    <Input
                      value={editedQuery}
                      onChange={(e) => setEditedQuery(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ej: Apartamento 2 habitaciones en Laureles..."
                      className="mb-3 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        onClick={handleCancelEdit}
                        size="sm"
                        variant="outline"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveQuery}
                        size="sm"
                        className="gap-2"
                      >
                        <Search className="h-4 w-4" />
                        Buscar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="bg-card border border-border rounded-2xl p-4 hover:border-primary/50 transition-all cursor-pointer group shadow-sm hover:shadow-md" 
                    onClick={handleEditQuery}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Search className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Tu búsqueda:</p>
                          <p className="text-sm font-semibold text-foreground truncate">"{queryParam}"</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-primary flex-shrink-0">
                        <span className="text-sm font-medium hidden sm:inline">Editar</span>
                        <Edit2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                  </div>
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
                const isFavorite = favorites?.includes(property.id) || false;
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
                    isFavorite={isFavorite}
                  />
                );
              })}
            </div>
          ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div
            className="
              w-full
              max-w-3xl                   /* 🔹 más ancho aún (~1024px) */
              bg-card
              border border-border
              rounded-2xl
              p-6 md:p-8 lg:p-10          /* padding equilibrado */
              text-center
              shadow-lg
              transition-all
              duration-300
              hover:shadow-xl
            "
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="w-9 h-9 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              No encontramos propiedades disponibles
            </h2>

            <p className="text-muted-foreground mb-6 text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
              No hay inmuebles en nuestro catálogo que coincidan con los criterios de búsqueda que especificaste.
            </p>

            <div className="bg-muted/50 rounded-xl p-4 md:p-5 mb-6 text-left max-w-3xl mx-auto">
              <p className="text-base font-semibold mb-2">💡 Te sugerimos:</p>
              <ul className="text-sm md:text-base text-muted-foreground space-y-1.5">
                <li>• Ampliar el radio de búsqueda</li>
                <li>• Ajustar el rango de precios</li>
                <li>• Reducir el número de habitaciones requeridas</li>
                <li>• Probar con otra ubicación cercana</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-6 py-2.5 text-sm md:text-base"
              >
                Nueva búsqueda
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full sm:w-auto px-6 py-2.5 text-sm md:text-base"
              >
                Volver al inicio
              </Button>
            </div>
          </div>
        </div>


          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PropertiesCatalog;
