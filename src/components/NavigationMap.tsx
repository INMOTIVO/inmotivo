import { useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, DirectionsRenderer, OverlayView } from '@react-google-maps/api';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { X, Navigation, Edit2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { playNotificationSound } from '@/utils/notificationSound';

interface NavigationMapProps {
  destination: [number, number];
  filters: any;
  onStopNavigation: () => void;
  searchCriteria?: string;
}

const NavigationMap = ({ destination, filters, onStopNavigation, searchCriteria = '' }: NavigationMapProps) => {
  const navigate = useNavigate();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editSearchQuery, setEditSearchQuery] = useState(searchCriteria);
  const [searchRadius, setSearchRadius] = useState<number>(300);
  const [isPaused, setIsPaused] = useState(false);
  const previousPropertiesCount = useRef<number>(0);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // Fetch real properties from database and position them around user location
  // More radius = more properties (200m-1km range)
  const getPropertyLimit = (radius: number) => {
    if (radius <= 400) return 5;
    if (radius <= 700) return 8;
    return 12;
  };

  const { data: properties } = useQuery({
    queryKey: ['navigation-properties', userLocation, searchRadius],
    queryFn: async () => {
      if (!userLocation) return [];

      const limit = getPropertyLimit(searchRadius);

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .limit(limit);

      if (error) {
        console.error('Error fetching navigation properties:', error);
        return [];
      }

      // Position real properties within search radius around user
      return (data || []).map((property, index) => {
        const angle = (index / Math.max(data.length, 1)) * 2 * Math.PI;
        const maxDistanceDegrees = (searchRadius / 111000);
        const minDistanceDegrees = (searchRadius * 0.3 / 111000);
        const distance = minDistanceDegrees + Math.random() * (maxDistanceDegrees - minDistanceDegrees);
        const lat = userLocation.lat + distance * Math.cos(angle);
        const lng = userLocation.lng + distance * Math.sin(angle);

        return {
          ...property,
          latitude: lat,
          longitude: lng,
        };
      });
    },
    enabled: !!userLocation,
  });

  // Track user location
  useEffect(() => {
    let watchId: number;
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 5000;

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (isPaused) return;

        const now = Date.now();
        if (now - lastUpdate < UPDATE_INTERVAL) return;
        lastUpdate = now;

        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(newLocation);
        
        if (position.coords.heading !== null) {
          setHeading(position.coords.heading);
        }

        if (mapRef.current) {
          mapRef.current.panTo(newLocation);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === 1) {
          toast.error('Permiso de ubicación denegado', { id: 'geo-error' });
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isPaused]);

  // Calculate directions when user location or destination changes
  useEffect(() => {
    if (!userLocation || !isLoaded || isPaused) return;

    const directionsService = new google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin: userLocation,
        destination: { lat: destination[0], lng: destination[1] },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        }
      }
    );
  }, [userLocation, destination, isPaused, isLoaded]);

  // Detect new properties and play notification
  useEffect(() => {
    if (!properties) return;

    const currentCount = properties.length;
    if (previousPropertiesCount.current > 0 && currentCount > previousPropertiesCount.current) {
      const newPropertiesCount = currentCount - previousPropertiesCount.current;
      playNotificationSound();
      toast.success(`${newPropertiesCount} nueva${newPropertiesCount > 1 ? 's' : ''} propiedad${newPropertiesCount > 1 ? 'es' : ''} cerca de ti`, {
        duration: 3000,
      });
    }
    previousPropertiesCount.current = currentCount;
  }, [properties]);

  const handleToggleNavigation = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      toast.info("Navegación pausada");
    } else {
      toast.success("Navegación reanudada");
    }
  };

  const handleUpdateSearch = () => {
    if (!editSearchQuery.trim()) {
      toast.error("Por favor ingresa una búsqueda");
      return;
    }
    
    // Update URL with new search query
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('query', editSearchQuery.trim());
    
    navigate(`/navegacion?${currentParams.toString()}`, { replace: true });
    setIsEditDialogOpen(false);
    toast.success("Búsqueda actualizada");
  };

  if (!isLoaded) {
    return <div className="w-full h-full flex items-center justify-center">Cargando mapa...</div>;
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={userLocation || { lat: 6.2476, lng: -75.5658 }}
        zoom={15}
        onLoad={(map) => { mapRef.current = map; }}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {/* User location marker with animation */}
        {userLocation && (
          <>
            <OverlayView
              position={userLocation}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div style={{ position: 'relative', transform: 'translate(-50%, -100%)' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  animation: 'bounce 1s ease-in-out infinite',
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 4px 12px rgba(139, 92, 246, 0.5))' }}>
                    <circle cx="12" cy="5" r="2.5" fill="#8b5cf6" stroke="white" strokeWidth="1.5"/>
                    <path d="M12 7.5 L12 14" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M12 9 L9 11" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round">
                      <animate attributeName="d" values="M12 9 L9 11;M12 9 L9 13;M12 9 L9 11" dur="1s" repeatCount="indefinite"/>
                    </path>
                    <path d="M12 9 L15 13" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round">
                      <animate attributeName="d" values="M12 9 L15 13;M12 9 L15 11;M12 9 L15 13" dur="1s" repeatCount="indefinite"/>
                    </path>
                    <path d="M12 14 L10 19" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round">
                      <animate attributeName="d" values="M12 14 L10 19;M12 14 L11 20;M12 14 L10 19" dur="1s" repeatCount="indefinite"/>
                    </path>
                    <path d="M12 14 L14 20" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round">
                      <animate attributeName="d" values="M12 14 L14 20;M12 14 L13 19;M12 14 L14 20" dur="1s" repeatCount="indefinite"/>
                    </path>
                  </svg>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                    borderRadius: '50%',
                    border: '3px solid white',
                    boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)',
                    animation: 'pulse 2s ease-in-out infinite',
                  }}></div>
                </div>
                <style>{`
                  @keyframes bounce {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-4px); }
                  }
                  @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.8; }
                  }
                `}</style>
              </div>
            </OverlayView>

            {/* Search radius circle */}
            <Circle
              center={userLocation}
              radius={searchRadius}
              options={{
                strokeColor: '#8b5cf6',
                strokeOpacity: 1,
                strokeWeight: 3,
                fillColor: '#a78bfa',
                fillOpacity: 0.15,
              }}
            />
          </>
        )}

        {/* Directions route */}
        {directions && !isPaused && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#8b5cf6',
                strokeWeight: 7,
                strokeOpacity: 0.8,
              },
            }}
          />
        )}

        {/* Property markers */}
        {properties?.map((property) => {
          if (!property.latitude || !property.longitude) return null;

          const priceFormatted = new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
          }).format(property.price);

          return (
            <OverlayView
              key={property.id}
              position={{ lat: property.latitude, lng: property.longitude }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div 
                style={{ 
                  transform: 'translate(-50%, -100%)', 
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={() => navigate(`/property/${property.id}`)}
              >
                <div style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                }}>
                  {priceFormatted} $
                </div>
                <svg width="32" height="40" viewBox="0 0 32 40" style={{ filter: 'drop-shadow(0 6px 10px rgba(16, 185, 129, 0.4))' }}>
                  <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24C32 7.163 24.837 0 16 0z" fill="#10b981" />
                  <circle cx="16" cy="16" r="6" fill="white" />
                </svg>
              </div>
            </OverlayView>
          );
        })}
      </GoogleMap>
      
      {/* Botón Pausar/Reanudar - Móvil: bottom left, Desktop: bottom left */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <Button
          onClick={handleToggleNavigation}
          variant={isPaused ? "default" : "destructive"}
          size="lg"
          className={`shadow-lg px-4 py-2 md:px-6 md:py-2.5 h-auto ${
            isPaused ? 'bg-green-600 hover:bg-green-700' : ''
          }`}
        >
          {isPaused ? (
            <>
              <Navigation className="mr-2 h-5 w-5" />
              <span className="font-semibold">Ir</span>
            </>
          ) : (
            <>
              <X className="mr-2 h-5 w-5" />
              <span className="font-semibold">Detener</span>
            </>
          )}
        </Button>
      </div>

      {userLocation && (
        <>
          {/* Navigation Status - Mobile: top left, Desktop: top left */}
          <div className="absolute top-4 right-4 md:top-20 md:right-4 z-[1000] bg-background/95 backdrop-blur p-3 md:p-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <Navigation className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
              <span className="font-semibold text-sm md:text-base leading-tight">Navegando</span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground leading-tight">
              Actualizando en tiempo real
            </p>
          </div>

          {/* Search Criteria Card - Mobile: bottom right, Desktop: bottom right */}
          <Card className="absolute bottom-20 md:bottom-4 right-4 z-[1000] bg-background/90 backdrop-blur-md p-3 md:p-4 w-[calc(60%-1rem)] md:w-auto md:min-w-[280px] md:max-w-sm">
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 md:mb-2">
                    <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
                    <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase">
                      Buscando
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-medium leading-tight line-clamp-2">
                    {searchCriteria || 'Propiedades cerca'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 md:h-8 md:w-8 p-0 shrink-0"
                  onClick={() => {
                    setEditSearchQuery(searchCriteria);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit2 className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </div>

              <div className="pt-2 md:pt-3 border-t space-y-2 md:space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] md:text-xs">
                    <span className="text-muted-foreground">Radio de búsqueda</span>
                    <span className="font-semibold text-primary">
                      {searchRadius >= 1000 ? `${(searchRadius / 1000).toFixed(1)} km` : `${searchRadius} m`}
                    </span>
                  </div>
                  <Slider
                    value={[searchRadius]}
                    onValueChange={(value) => setSearchRadius(value[0])}
                    min={200}
                    max={1000}
                    step={50}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[9px] md:text-[10px] text-muted-foreground">
                    <span>200m</span>
                    <span>1km</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] md:text-xs pt-1 border-t">
                  <span className="text-muted-foreground">Propiedades</span>
                  <span className="font-semibold text-primary">{properties?.length || 0}</span>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Dialog para editar búsqueda */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md z-[10000]">
          <DialogHeader>
            <DialogTitle>Modificar búsqueda</DialogTitle>
            <DialogDescription>
              Edita tu búsqueda actual para encontrar otras propiedades cercanas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search-query">¿Qué buscas?</Label>
              <Input
                id="search-query"
                placeholder="Ej: Apartamento de 2 habitaciones"
                value={editSearchQuery}
                onChange={(e) => setEditSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateSearch();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateSearch}>
              Actualizar búsqueda
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NavigationMap;
