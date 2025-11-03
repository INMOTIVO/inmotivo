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
import { X, Navigation, Edit2, MapPin, Car } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { playNotificationSound } from '@/utils/notificationSound';
interface NavigationMapProps {
  destination: [number, number];
  filters: any;
  onStopNavigation: () => void;
  searchCriteria?: string;
}
const NavigationMap = ({
  destination,
  filters,
  onStopNavigation,
  searchCriteria = ''
}: NavigationMapProps) => {
  const navigate = useNavigate();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editSearchQuery, setEditSearchQuery] = useState(searchCriteria);
  const [searchRadius, setSearchRadius] = useState<number>(200);
  const [isPaused, setIsPaused] = useState(false);
  const previousPropertiesCount = useRef<number>(0);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(18);
  const isManualRadiusChange = useRef(false);
  
  // Estados para detección de velocidad y modo vehículo
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [isVehicleMode, setIsVehicleMode] = useState(false);
  const [collectedProperties, setCollectedProperties] = useState<any[]>([]);
  const [showCollectedProperties, setShowCollectedProperties] = useState(false);
  const previousLocation = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const collectedPropertyIds = useRef<Set<string>>(new Set());
  const travelDistance = useRef<number>(0);
  const {
    isLoaded
  } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  // Convertir zoom a radio de búsqueda
  const zoomToRadius = (zoom: number): number => {
    // Zoom 19+ = 100m, Zoom 18 = 200m, Zoom 17 = 300m, Zoom 16 = 500m, Zoom 15 = 750m, Zoom 14- = 1000m
    if (zoom >= 19) return 100;
    if (zoom >= 18) return 200;
    if (zoom >= 17) return 300;
    if (zoom >= 16) return 500;
    if (zoom >= 15) return 750;
    return 1000;
  };

  // Sincronizar radio con zoom cuando no sea cambio manual
  useEffect(() => {
    if (!isManualRadiusChange.current) {
      const newRadius = zoomToRadius(mapZoom);
      setSearchRadius(newRadius);
    }
    isManualRadiusChange.current = false;
  }, [mapZoom]);

  // Manejar cambios en el zoom del mapa
  const handleZoomChanged = () => {
    if (mapRef.current) {
      const zoom = mapRef.current.getZoom();
      if (zoom !== undefined) {
        setMapZoom(zoom);
      }
    }
  };

  // Manejar cambios manuales en el radio
  const handleManualRadiusChange = (value: number) => {
    isManualRadiusChange.current = true;
    setSearchRadius(value);

    // Ajustar zoom del mapa según el radio manual
    if (mapRef.current) {
      let targetZoom = 17;
      if (value <= 100) targetZoom = 19;else if (value <= 200) targetZoom = 18;else if (value <= 300) targetZoom = 17;else if (value <= 500) targetZoom = 16;else if (value <= 750) targetZoom = 15;else targetZoom = 14;
      mapRef.current.setZoom(targetZoom);
    }
  };

  // Fetch real properties from database and position them around user location
  // More radius = more properties (100m-1km range)
  const getPropertyLimit = (radius: number) => {
    if (radius <= 200) return 3;
    if (radius <= 400) return 5;
    if (radius <= 700) return 8;
    return 12;
  };
  const {
    data: properties
  } = useQuery({
    queryKey: ['navigation-properties', userLocation, searchRadius],
    queryFn: async () => {
      if (!userLocation) return [];
      const limit = getPropertyLimit(searchRadius);
      const {
        data,
        error
      } = await supabase.from('properties').select('*').eq('status', 'available').limit(limit);
      if (error) {
        console.error('Error fetching navigation properties:', error);
        return [];
      }

      // Position real properties within search radius around user
      return (data || []).map((property, index) => {
        const angle = index / Math.max(data.length, 1) * 2 * Math.PI;
        const maxDistanceDegrees = searchRadius / 111000;
        const minDistanceDegrees = searchRadius * 0.3 / 111000;
        const distance = minDistanceDegrees + Math.random() * (maxDistanceDegrees - minDistanceDegrees);
        const lat = userLocation.lat + distance * Math.cos(angle);
        const lng = userLocation.lng + distance * Math.sin(angle);
        return {
          ...property,
          latitude: lat,
          longitude: lng
        };
      });
    },
    enabled: !!userLocation && !isPaused
  });

  // Track user location and speed
  useEffect(() => {
    let watchId: number;
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 3000; // Reducido para mejor detección de velocidad
    
    watchId = navigator.geolocation.watchPosition(position => {
      if (isPaused) return;
      const now = Date.now();
      if (now - lastUpdate < UPDATE_INTERVAL) return;
      lastUpdate = now;
      
      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      // Calcular velocidad
      let speed = 0;
      if (previousLocation.current) {
        const timeDiff = (now - previousLocation.current.time) / 1000 / 3600; // en horas
        const distance = calculateDistance(
          previousLocation.current.lat,
          previousLocation.current.lng,
          newLocation.lat,
          newLocation.lng
        ); // en km
        
        speed = distance / timeDiff; // km/h
        setCurrentSpeed(speed);
        
        // Acumular distancia recorrida
        if (isVehicleMode) {
          travelDistance.current += distance;
          
          // Limitar a 2km de registro
          if (travelDistance.current > 2) {
            // Resetear el registro más antiguo
            collectedPropertyIds.current.clear();
            setCollectedProperties([]);
            travelDistance.current = 0;
          }
        }
      }
      
      // Detectar modo vehículo (>10 km/h)
      if (speed > 10 && !isVehicleMode) {
        setIsVehicleMode(true);
        travelDistance.current = 0;
        collectedPropertyIds.current.clear();
        setCollectedProperties([]);
        toast.info("Modo conducción activado", {
          description: "Las propiedades se guardarán automáticamente"
        });
      } else if (speed <= 10 && isVehicleMode) {
        setIsVehicleMode(false);
        if (collectedProperties.length > 0) {
          setShowCollectedProperties(true);
          toast.success(`${collectedProperties.length} propiedades encontradas en tu recorrido`);
        }
      }
      
      previousLocation.current = { lat: newLocation.lat, lng: newLocation.lng, time: now };
      setUserLocation(newLocation);
      
      if (position.coords.heading !== null) {
        setHeading(position.coords.heading);
      }
      if (mapRef.current && !isVehicleMode) {
        mapRef.current.panTo(newLocation);
      }
    }, error => {
      console.error('Geolocation error:', error);
      if (error.code === 1) {
        toast.error('Permiso de ubicación denegado', {
          id: 'geo-error'
        });
      }
    }, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000
    });
    
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isPaused, isVehicleMode, collectedProperties.length]);
  
  // Función para calcular distancia entre dos puntos (Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate directions when user location or destination changes
  useEffect(() => {
    if (!userLocation || !isLoaded || isPaused) return;
    const directionsService = new google.maps.DirectionsService();
    directionsService.route({
      origin: userLocation,
      destination: {
        lat: destination[0],
        lng: destination[1]
      },
      travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        setDirections(result);
      }
    });
  }, [userLocation, destination, isPaused, isLoaded]);

  // Detect new properties and play notification
  useEffect(() => {
    if (!properties) return;
    const currentCount = properties.length;
    
    // En modo vehículo, guardar propiedades
    if (isVehicleMode && properties.length > 0) {
      const newProperties = properties.filter(p => !collectedPropertyIds.current.has(p.id));
      if (newProperties.length > 0) {
        newProperties.forEach(p => collectedPropertyIds.current.add(p.id));
        setCollectedProperties(prev => [...prev, ...newProperties]);
        playNotificationSound();
        toast.info(`${newProperties.length} propiedad${newProperties.length > 1 ? 'es' : ''} detectada${newProperties.length > 1 ? 's' : ''}`, {
          duration: 2000
        });
      }
    } else if (!isVehicleMode) {
      // Modo normal
      if (previousPropertiesCount.current > 0 && currentCount > previousPropertiesCount.current) {
        const newPropertiesCount = currentCount - previousPropertiesCount.current;
        playNotificationSound();
        toast.success(`${newPropertiesCount} nueva${newPropertiesCount > 1 ? 's' : ''} propiedad${newPropertiesCount > 1 ? 'es' : ''} cerca de ti`, {
          duration: 3000
        });
      }
    }
    
    previousPropertiesCount.current = currentCount;
  }, [properties, isVehicleMode]);
  const handleToggleNavigation = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    
    if (newPausedState) {
      // Pausar: zoom out a 500 metros
      handleManualRadiusChange(500);
      toast.info("Navegación pausada");
    } else {
      // Reanudar: zoom in a 100 metros
      handleManualRadiusChange(100);
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
    navigate(`/navegacion?${currentParams.toString()}`, {
      replace: true
    });
    setIsEditDialogOpen(false);
    toast.success("Búsqueda actualizada");
  };
  if (!isLoaded) {
    return <div className="w-full h-full flex items-center justify-center">Cargando mapa...</div>;
  }
  return <div className="relative w-full h-full">
      <GoogleMap mapContainerStyle={{
      width: '100%',
      height: '100%'
    }} center={userLocation || {
      lat: 6.2476,
      lng: -75.5658
    }} zoom={mapZoom} onLoad={map => {
      mapRef.current = map;
    }} onZoomChanged={handleZoomChanged} options={{
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false
    }}>
        {/* User location marker with animation */}
        {userLocation && <>
            <OverlayView position={userLocation} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
              <div style={{
            position: 'relative',
            transform: 'translate(-50%, -100%)'
          }}>
                <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}>
                  {/* Pulse rings */}
                  <div style={{
                position: 'absolute',
                width: '60px',
                height: '60px',
                top: '-10px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.3)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }} />
                  <div style={{
                position: 'absolute',
                width: '50px',
                height: '50px',
                top: '-5px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.4)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.5s'
              }} />
                  
                  {directions ?
              // Navigation arrow when actively navigating
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" style={{
                filter: 'drop-shadow(0 8px 20px rgba(34, 197, 94, 0.7))',
                position: 'relative',
                zIndex: 10,
                transform: `rotate(${heading}deg)`,
                transition: 'transform 0.3s ease-out'
              }}>
                      {/* Arrow shadow */}
                      <path d="M12 2L4 20L12 16L20 20L12 2Z" fill="rgba(0,0,0,0.2)" transform="translate(0, 1)" />
                      
                      {/* Main arrow body */}
                      <path d="M12 2L4 20L12 16L20 20L12 2Z" fill="url(#arrowGradient)" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                      
                      {/* Arrow highlight */}
                      <path d="M12 2L12 14" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
                      
                      {/* Pulse effect */}
                      <circle cx="12" cy="12" r="8" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.4">
                        <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                      </circle>
                      
                      <defs>
                        <linearGradient id="arrowGradient" x1="12" y1="2" x2="12" y2="20" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#4ade80" />
                          <stop offset="50%" stopColor="#22c55e" />
                          <stop offset="100%" stopColor="#16a34a" />
                        </linearGradient>
                      </defs>
                    </svg> :
              // Location pin when not navigating
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{
                filter: 'drop-shadow(0 8px 16px rgba(34, 197, 94, 0.6))',
                position: 'relative',
                zIndex: 10
              }}>
                      {/* Outer glow */}
                      <circle cx="12" cy="10" r="7" fill="url(#glow)" opacity="0.4" />
                      
                      {/* Main pin shape */}
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="url(#gradient)" stroke="white" strokeWidth="1.5" />
                      
                      {/* Inner dot with pulse */}
                      <circle cx="12" cy="9" r="3" fill="white">
                        <animate attributeName="r" values="3;3.5;3" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0.8;1" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                      
                      {/* Gradients */}
                      <defs>
                        <linearGradient id="gradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#4ade80" />
                          <stop offset="100%" stopColor="#22c55e" />
                        </linearGradient>
                        <radialGradient id="glow" cx="12" cy="10" r="7" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#4ade80" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                        </radialGradient>
                      </defs>
                    </svg>}
                  <div style={{
                width: '16px',
                height: '16px',
                background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                borderRadius: '50%',
                border: '3px solid white',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)',
                animation: 'pulse 2s ease-in-out infinite'
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
            <Circle center={userLocation} radius={searchRadius} options={{
          strokeColor: '#8b5cf6',
          strokeOpacity: 1,
          strokeWeight: 3,
          fillColor: '#a78bfa',
          fillOpacity: 0.15
        }} />
          </>}

        {/* Directions route */}
        {directions && !isPaused && <DirectionsRenderer directions={directions} options={{
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#8b5cf6',
          strokeWeight: 7,
          strokeOpacity: 0.8
        }
      }} />}

        {/* Property markers */}
        {!isPaused && properties?.map(property => {
        if (!property.latitude || !property.longitude) return null;
        const priceFormatted = new Intl.NumberFormat('es-CO', {
          minimumFractionDigits: 0
        }).format(property.price);
        return <OverlayView key={property.id} position={{
          lat: property.latitude,
          lng: property.longitude
        }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
              <div style={{
            transform: 'translate(-50%, -100%)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }} onClick={() => navigate(`/property/${property.id}`)}>
                <div style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '700',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
            }}>
                  {priceFormatted} $
                </div>
                <svg width="32" height="40" viewBox="0 0 32 40" style={{
              filter: 'drop-shadow(0 6px 10px rgba(16, 185, 129, 0.4))'
            }}>
                  <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24C32 7.163 24.837 0 16 0z" fill="#10b981" />
                  <circle cx="16" cy="16" r="6" fill="white" />
                </svg>
              </div>
            </OverlayView>;
      })}
      </GoogleMap>
      
      {/* Barra de control inferior - ocupa todo el ancho */}
      {userLocation && <div className="absolute bottom-0 left-0 right-0 z-[1000]">
          <Card className={`rounded-none border-x-0 border-b-0 border-t-4 border-t-yellow-500 backdrop-blur-md shadow-2xl ${!isPaused ? 'bg-background/30' : 'bg-background/95'}`}>
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center gap-3">
                {/* Botón Ir/Detener */}
                <Button onClick={handleToggleNavigation} variant={isPaused ? "default" : "destructive"} size="lg" className={`shrink-0 px-6 py-6 h-auto ${isPaused ? 'bg-green-600 hover:bg-green-700' : ''}`}>
                  {isPaused ? <>
                      <Navigation className="h-6 w-6" />
                    </> : <>
                      <X className="h-6 w-6" />
                    </>}
                </Button>

                <div className="flex-1 min-w-0">
                  {/* Radio y propiedades */}
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Radio</span>
                        <span className="font-semibold text-primary">
                          {searchRadius >= 1000 ? `${(searchRadius / 1000).toFixed(1)} km` : `${searchRadius} m`}
                        </span>
                      </div>
                      <Slider value={[searchRadius]} onValueChange={value => handleManualRadiusChange(value[0])} min={100} max={1000} step={50} className="w-full" />
                    </div>
                    
                  </div>

                  {/* Información de búsqueda */}
                  <div 
                    className="flex items-center justify-between gap-2 border-2 border-green-500 rounded-lg p-2 cursor-pointer hover:bg-accent/10 transition-colors"
                    onClick={() => {
                      setEditSearchQuery(searchCriteria);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                      <p className="text-sm font-medium leading-tight line-clamp-1">
                        {searchCriteria || 'Propiedades cerca'}
                      </p>
                    </div>
                    <Edit2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>}

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
              <Input id="search-query" placeholder="Ej: Apartamento de 2 habitaciones" value={editSearchQuery} onChange={e => setEditSearchQuery(e.target.value)} onKeyDown={e => {
              if (e.key === 'Enter') {
                handleUpdateSearch();
              }
            }} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateSearch}>
              Actualizar búsqueda
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Overlay de modo vehículo */}
      {isVehicleMode && (
        <div className="absolute inset-0 z-[9999] bg-gradient-to-br from-primary/95 to-accent/95 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="text-center space-y-8 px-4">
            {/* Ícono de carro animado */}
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <Car className="w-32 h-32 text-white/30 mx-auto" />
              </div>
              <Car className="w-32 h-32 text-white mx-auto relative z-10 animate-pulse" />
            </div>

            {/* Información */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white">Modo Conducción</h2>
              <p className="text-xl text-white/90">
                Velocidad: <span className="font-bold">{Math.round(currentSpeed)} km/h</span>
              </p>
              <p className="text-lg text-white/80">
                Guardando propiedades en tu recorrido...
              </p>
              <p className="text-sm text-white/70">
                Propiedades detectadas: <span className="font-semibold">{collectedProperties.length}</span>
              </p>
              <p className="text-sm text-white/70">
                Distancia recorrida: <span className="font-semibold">{(travelDistance.current * 1000).toFixed(0)}m</span>
              </p>
            </div>

            {/* Mensaje de seguridad */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 max-w-md mx-auto border border-white/20">
              <p className="text-white text-sm leading-relaxed">
                🚗 Por tu seguridad, la pantalla está bloqueada mientras conduces.
                Las propiedades se guardarán automáticamente y las verás cuando te detengas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de propiedades recolectadas */}
      <Dialog open={showCollectedProperties} onOpenChange={setShowCollectedProperties}>
        <DialogContent className="sm:max-w-2xl z-[10000] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Propiedades en tu Recorrido</DialogTitle>
            <DialogDescription>
              Encontramos {collectedProperties.length} propiedad{collectedProperties.length !== 1 ? 'es' : ''} durante tu viaje
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {collectedProperties.map((property) => {
              const priceFormatted = new Intl.NumberFormat('es-CO', {
                minimumFractionDigits: 0
              }).format(property.price);
              
              return (
                <Card 
                  key={property.id} 
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setShowCollectedProperties(false);
                    navigate(`/property/${property.id}`);
                  }}
                >
                  <div className="flex gap-4">
                    {property.images && property.images[0] && (
                      <img 
                        src={property.images[0]} 
                        alt={property.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
                      <p className="text-2xl font-bold text-primary">${priceFormatted}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {property.neighborhood}, {property.city}
                      </p>
                      <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                        {property.bedrooms > 0 && <span>{property.bedrooms} hab</span>}
                        {property.bathrooms > 0 && <span>• {property.bathrooms} baños</span>}
                        {property.area_m2 && <span>• {property.area_m2} m²</span>}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => {
              setShowCollectedProperties(false);
              setCollectedProperties([]);
              collectedPropertyIds.current.clear();
              travelDistance.current = 0;
            }}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default NavigationMap;