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
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const { data: properties } = useQuery({
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
    refetchInterval: 3000,
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
      <div className="absolute top-4 left-4 z-[1000] max-w-xs">
        <Card className="p-3 bg-background/95 backdrop-blur shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Propiedades cercanas</h3>
            {selectedProperties.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSelected(true)}
              >
                Ver seleccionadas ({selectedProperties.length})
              </Button>
            )}
          </div>
          <div className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto">
            {!properties || properties.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Buscando propiedades cercanas...
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
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedProperties.includes(property.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => navigate(`/property/${property.id}`)}
                >
                  <div className="flex gap-3">
                    {images[0] && (
                      <img
                        src={images[0]}
                        alt={property.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{property.title}</h4>
                      <p className="text-primary font-semibold text-sm">{priceFormatted}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                          {property.distance.toFixed(1)} km • {property.neighborhood}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/property/${property.id}`);
                        }}
                        className="mt-2 w-full text-xs h-7"
                      >
                        Ver detalles
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
