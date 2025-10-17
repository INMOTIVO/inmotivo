import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, MessageCircle, Calendar, X } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useNavigate } from 'react-router-dom';

interface NearbyPropertiesProps {
  filters: any;
  searchCriteria: string;
}

const NearbyProperties = ({ filters, searchCriteria }: NearbyPropertiesProps) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [showSelected, setShowSelected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 10000; // Actualizar solo cada 10 segundos
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastUpdate >= UPDATE_INTERVAL) {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          lastUpdate = now;
        }
      },
      (error) => console.error('Geolocation error:', error),
      { 
        enableHighAccuracy: false, // Menos preciso pero más estable
        maximumAge: 10000,
        timeout: 5000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const { data: properties, isLoading } = useQuery({
    queryKey: ['nearby-properties', filters, userLocation],
    queryFn: async () => {
      if (!userLocation) {
        console.log('NearbyProperties: No user location yet');
        return [];
      }

      console.log('NearbyProperties: Fetching with filters:', filters);
      console.log('NearbyProperties: User location:', userLocation);

      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .lte('price', 25000000) // Max price 25M
        .limit(10); // Get more than we need

      if (filters.minPrice) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice) query = query.lte('price', Math.min(filters.maxPrice, 25000000));
      if (filters.bedrooms) query = query.gte('bedrooms', filters.bedrooms);
      if (filters.propertyType) query = query.eq('property_type', filters.propertyType);

      const { data, error } = await query;
      if (error) {
        console.error('NearbyProperties: Query error:', error);
        throw error;
      }

      console.log('NearbyProperties: Raw properties fetched:', data?.length || 0);

      // Calculate distance and filter
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      // Filter and sort real properties
      const nearbyProperties = data
        ?.filter((property) => {
          if (!property.latitude || !property.longitude) return false;
          const distance = calculateDistance(
            userLocation[0],
            userLocation[1],
            property.latitude,
            property.longitude
          );
          return distance <= 2; // 2km radius
        })
        .map((property) => ({
          ...property,
          distance: calculateDistance(
            userLocation[0],
            userLocation[1],
            property.latitude!,
            property.longitude!
          ),
        }))
        .sort((a, b) => a.distance - b.distance) || [];

      // Always ensure 5 properties for MVP
      const propertiesNeeded = 5 - nearbyProperties.length;
      
      if (propertiesNeeded > 0 && data && data.length > 0) {
        // Add more properties from the fetched list, distributed around user location
        const additionalProperties = data
          .filter(p => p.latitude && p.longitude && !nearbyProperties.find(np => np.id === p.id))
          .slice(0, propertiesNeeded)
          .map((property, index) => ({
            ...property,
            distance: calculateDistance(
              userLocation[0],
              userLocation[1],
              property.latitude!,
              property.longitude!
            ),
          }));
        
        nearbyProperties.push(...additionalProperties);
      }

      return nearbyProperties.slice(0, 5); // Always return exactly 5
    },
    enabled: !!userLocation,
    staleTime: 30000,
    refetchInterval: false, // Deshabilitar refetch automático
    gcTime: 5 * 60 * 1000, // Mantener en caché 5 minutos
  });

  console.log('NearbyProperties: Final properties:', properties?.length || 0);

  const togglePropertySelection = (id: string) => {
    setSelectedProperties((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleContactWhatsApp = (property: any) => {
    const message = encodeURIComponent(
      `Hola, estoy interesado en la propiedad: ${property.title} en ${property.neighborhood}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleContactPhone = () => {
    toast.info('Función de llamada disponible próximamente');
  };

  const handleScheduleVisit = (property: any) => {
    toast.success(`Solicitud de visita para ${property.title} enviada`);
  };

  const selectedPropertiesList = properties?.filter((p) =>
    selectedProperties.includes(p.id)
  );

  console.log('NearbyProperties render - properties count:', properties?.length || 0);

  // Always show panel with loading or properties
  return (
    <>
      <div className="absolute top-4 left-4 z-[1000] w-[180px] md:w-[260px]">
        <Card className="p-1.5 md:p-3 bg-background/95 backdrop-blur shadow-lg">
          <div className="flex items-center justify-between mb-1.5 md:mb-2">
            <h3 className="font-semibold text-xs md:text-base">Cercanas</h3>
            {selectedProperties.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSelected(true)}
                className="text-[10px] md:text-xs h-6 md:h-7 px-2"
              >
                Ver ({selectedProperties.length})
              </Button>
            )}
          </div>
          <div className="space-y-1 md:space-y-2 max-h-[calc(100vh-14rem)] md:max-h-[calc(100vh-20rem)] overflow-y-auto">
            {isLoading || !properties || properties.length === 0 ? (
              <div className="text-center py-3 md:py-8">
                <p className="text-[10px] md:text-sm text-muted-foreground">
                  {isLoading ? 'Buscando...' : 'No hay propiedades'}
                </p>
              </div>
            ) : (
              properties.map((property) => {
              const images = (property.images as string[]) || [];
              const priceFormatted = new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: property.currency,
                minimumFractionDigits: 0,
              }).format(property.price);

              return (
                <Card
                  key={property.id}
                  className={`p-1.5 md:p-2 cursor-pointer transition-colors ${
                    selectedProperties.includes(property.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => navigate(`/property/${property.id}`)}
                >
                  <div className="flex gap-1.5 md:gap-2">
                    {images[0] && (
                      <img
                        src={images[0]}
                        alt={property.title}
                        className="w-12 h-12 md:w-20 md:h-20 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[10px] md:text-sm truncate leading-tight">{property.title}</h4>
                      <p className="text-primary font-semibold text-[10px] md:text-sm">{priceFormatted}</p>
                      <div className="flex items-center gap-0.5 text-[9px] md:text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-2 w-2 md:h-3 md:w-3 flex-shrink-0" />
                        <span className="truncate">
                          {property.distance.toFixed(1)} km
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/property/${property.id}`);
                        }}
                        className="mt-1 w-full text-[9px] md:text-xs h-5 md:h-7 py-0"
                      >
                        Ver
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            }))}
          </div>
        </Card>
      </div>

      <Sheet open={showSelected} onOpenChange={setShowSelected}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Propiedades seleccionadas ({selectedProperties.length})</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            {selectedPropertiesList?.map((property) => {
              const images = (property.images as string[]) || [];
              const priceFormatted = new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: property.currency,
                minimumFractionDigits: 0,
              }).format(property.price);

              return (
                <Card key={property.id} className="p-4">
                  {images[0] && (
                    <img
                      src={images[0]}
                      alt={property.title}
                      className="w-full h-48 object-cover rounded mb-3"
                    />
                  )}
                  <h3 className="font-semibold mb-1">{property.title}</h3>
                  <p className="text-primary font-bold mb-2">{priceFormatted}</p>
                  <p className="text-sm text-muted-foreground mb-1">
                    {property.neighborhood}, {property.city}
                  </p>
                  <p className="text-sm mb-3">
                    {property.bedrooms} hab • {property.bathrooms} baños • {property.area_m2} m²
                  </p>
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleContactWhatsApp(property)}
                      className="w-full"
                      variant="default"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Button
                      onClick={handleContactPhone}
                      className="w-full"
                      variant="outline"
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Llamar
                    </Button>
                    <Button
                      onClick={() => handleScheduleVisit(property)}
                      className="w-full"
                      variant="outline"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Agendar visita
                    </Button>
                    <Button
                      onClick={() => togglePropertySelection(property.id)}
                      className="w-full"
                      variant="ghost"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Quitar de selección
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default NearbyProperties;
