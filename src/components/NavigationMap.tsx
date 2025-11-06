import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
import { DrivingModeOverlay } from './DrivingModeOverlay';
import { SavedPropertiesReview } from './SavedPropertiesReview';
import { getCachedNearbyProperties, fetchRouteProperties, encodePolylineToGeoJSON } from '@/utils/navigationAPI';
import { calculateScore } from '@/utils/mapHelpers';
import { showPropertyAlert, requestNotificationPermission } from '@/utils/notificationManager';
import { debounce } from '@/utils/mapHelpers';
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
  const lastHeadingUpdate = useRef<number>(0);
  const smoothHeading = useRef<number>(0);
  
  // Estados para detección de velocidad y modo vehículo
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [isVehicleMode, setIsVehicleMode] = useState(false);
  const [collectedProperties, setCollectedProperties] = useState<any[]>([]);
  const [showCollectedProperties, setShowCollectedProperties] = useState(false);
  const previousLocation = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const collectedPropertyIds = useRef<Set<string>>(new Set());
  const travelDistance = useRef<number>(0);
  
  // Memoizar funciones para evitar re-renders
  const handlePropertyClick = useCallback((propertyId: string) => {
    navigate(`/property/${propertyId}`);
  }, [navigate]);
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

  // Fetch properties using new API - Optimizado con mejor caché
  const {
    data: propertiesGeoJSON,
    refetch: refetchProperties
  } = useQuery({
    queryKey: ['navigation-properties', userLocation, searchRadius, filters],
    queryFn: async () => {
      if (!userLocation) return null;
      
      try {
        const geojson = await getCachedNearbyProperties({
          lat: userLocation.lat,
          lon: userLocation.lng,
          radius: searchRadius,
          priceMax: filters.maxPrice,
          type: filters.propertyType || 'all'
        });
        
        return geojson;
      } catch (error) {
        console.error('Error fetching nearby properties:', error);
        return null; // No mostrar toast en cada error
      }
    },
    enabled: !!userLocation && !isPaused,
    refetchInterval: false,
    staleTime: isVehicleMode ? 15000 : 45000, // Caché más largo fuera de modo vehículo
    gcTime: 300000 // Mantener en caché 5 minutos
  });

  // Convert GeoJSON to properties array - Limitado para mejor rendimiento
  const properties = propertiesGeoJSON?.features
    ?.slice(0, isVehicleMode ? 10 : 20) // Menos marcadores en modo vehículo
    ?.map((feature: any) => ({
      id: feature.properties.id,
      title: feature.properties.title,
      price: feature.properties.price,
      bedrooms: feature.properties.bedrooms,
      bathrooms: feature.properties.bathrooms,
      area: feature.properties.area,
      property_type: feature.properties.property_type,
      images: feature.properties.images,
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      distance_km: feature.properties.distance_km
    })) || [];

  // Track user location and speed - Optimizado para móvil
  useEffect(() => {
    let watchId: number;
    let lastUpdate = 0;
    let animationFrameId: number;
    const UPDATE_INTERVAL = isVehicleMode ? 2000 : 5000; // Más lento cuando no está en vehículo
    
    watchId = navigator.geolocation.watchPosition(position => {
      if (isPaused) return;
      const now = Date.now();
      if (now - lastUpdate < UPDATE_INTERVAL) return;
      
      // Usar requestAnimationFrame para suavizar actualizaciones
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      
      animationFrameId = requestAnimationFrame(() => {
        lastUpdate = now;
      
      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      // Calcular velocidad y heading desde movimiento
      let speed = 0;
      let calculatedHeading = heading;
      
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
        
        // Calcular heading basado en el movimiento real
        const dLat = newLocation.lat - previousLocation.current.lat;
        const dLng = newLocation.lng - previousLocation.current.lng;
        
        // Solo calcular nuevo heading si hay movimiento significativo
        if (Math.abs(dLat) > 0.00001 || Math.abs(dLng) > 0.00001) {
          // Calcular bearing (rumbo) desde el punto anterior al nuevo
          // Norte = 0°, Este = 90°, Sur = 180°, Oeste = 270°
          let angle = Math.atan2(dLng, dLat) * 180 / Math.PI;
          
          // Convertir de ángulo matemático a bearing geográfico
          // y normalizar a 0-360
          angle = (90 - angle) % 360;
          if (angle < 0) angle += 360;
          
          calculatedHeading = angle;
          
          // Suavizar el heading para evitar saltos bruscos
          const headingDiff = calculatedHeading - smoothHeading.current;
          if (Math.abs(headingDiff) > 180) {
            // Manejo de cruce 0-360
            if (headingDiff > 0) {
              smoothHeading.current += (headingDiff - 360) * 0.3;
            } else {
              smoothHeading.current += (headingDiff + 360) * 0.3;
            }
          } else {
            smoothHeading.current += headingDiff * 0.3;
          }
          
          // Normalizar smooth heading
          if (smoothHeading.current < 0) smoothHeading.current += 360;
          if (smoothHeading.current >= 360) smoothHeading.current -= 360;
          
          lastHeadingUpdate.current = now;
        }
        
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
      
      // Detectar modo vehículo (>20 km/h)
      if (speed > 20 && !isVehicleMode) {
        setIsVehicleMode(true);
        travelDistance.current = 0;
        collectedPropertyIds.current.clear();
        setCollectedProperties([]);
        toast.info("Modo conducción activado", {
          description: "Pantalla bloqueada por seguridad. Las propiedades se guardarán automáticamente",
          duration: 4000
        });
      } else if (speed <= 20 && isVehicleMode) {
        setIsVehicleMode(false);
        if (collectedProperties.length > 0) {
          setShowCollectedProperties(true);
          toast.success(`${collectedProperties.length} propiedades encontradas en tu recorrido`);
        }
      }
      
      previousLocation.current = { lat: newLocation.lat, lng: newLocation.lng, time: now };
      setUserLocation(newLocation);
      
      // Usar heading del GPS si está disponible, sino usar el calculado
      if (position.coords.heading !== null && position.coords.heading >= 0) {
        const gpsHeading = position.coords.heading;
        smoothHeading.current = gpsHeading;
        setHeading(gpsHeading);
      } else if (calculatedHeading !== heading) {
        setHeading(smoothHeading.current);
      }
      
        if (mapRef.current) {
          // Pan suave - Solo actualizar si hay cambio significativo (>5 metros)
          const lastPos = mapRef.current.getCenter();
          if (lastPos) {
            const dist = calculateDistance(lastPos.lat(), lastPos.lng(), newLocation.lat, newLocation.lng);
            if (dist > 0.005) { // ~5 metros
              mapRef.current.panTo(newLocation);
            }
          }
          
          // Rotar mapa solo en modo vehículo para mejor rendimiento
          if (!isPaused && isVehicleMode && speed > 5) {
            mapRef.current.setHeading(smoothHeading.current);
            mapRef.current.setTilt(45);
          } else if (!isVehicleMode) {
            // Vista normal fuera de modo vehículo
            mapRef.current.setHeading(0);
            mapRef.current.setTilt(0);
          }
        }
      });
    }, error => {
      console.error('Geolocation error:', error);
      if (error.code === 1) {
        toast.error('Permiso de ubicación denegado', {
          id: 'geo-error'
        });
      }
    }, {
      enableHighAccuracy: true,
      maximumAge: 1000, // Permitir caché de 1 segundo
      timeout: 10000 // Aumentar timeout
    });
    
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPaused, isVehicleMode, collectedProperties.length, heading]);
  
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

  // Calculate directions - Optimizado para actualizar menos frecuentemente
  useEffect(() => {
    if (!userLocation || !isLoaded || isPaused) return;
    
    // Solo recalcular si nos movimos más de 50 metros
    const shouldRecalculate = !directions || (previousLocation.current && 
      calculateDistance(
        previousLocation.current.lat,
        previousLocation.current.lng,
        userLocation.lat,
        userLocation.lng
      ) > 0.05);
    
    if (!shouldRecalculate) return;
    
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

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Detect new properties and play notification with smart alerts
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
      // Modo normal con alertas inteligentes
      if (previousPropertiesCount.current > 0 && currentCount > previousPropertiesCount.current) {
        const newPropertiesCount = currentCount - previousPropertiesCount.current;
        
        // Check for high-score properties to alert
        properties.slice(-newPropertiesCount).forEach((property: any) => {
          const score = calculateScore(property, {
            priceMax: filters.maxPrice,
            bedrooms: filters.bedrooms,
            propertyType: filters.propertyType,
            distance: property.distance_km * 1000 // convert to meters
          });
          
          if (score >= 70) {
            showPropertyAlert({
              id: property.id,
              title: property.title,
              price: property.price,
              image: property.images?.[0],
              address: property.title
            });
          }
        });
        
        playNotificationSound();
        toast.success(`${newPropertiesCount} nueva${newPropertiesCount > 1 ? 's' : ''} propiedad${newPropertiesCount > 1 ? 'es' : ''} cerca de ti`, {
          duration: 3000
        });
      }
    }
    
    previousPropertiesCount.current = currentCount;
  }, [properties, isVehicleMode, filters]);
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
      fullscreenControl: false,
      rotateControl: false,
      gestureHandling: 'greedy',
      disableDefaultUI: true, // Menos UI = mejor rendimiento
      clickableIcons: false, // Menos interactividad = mejor rendimiento
      keyboardShortcuts: false
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
              // Navigation arrow when actively navigating - rota según la dirección de movimiento
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



        {/* Property markers - Optimizado con renderizado mínimo */}
        {!isPaused && properties?.map(property => {
          if (!property.latitude || !property.longitude) return null;
          
          return <Marker 
            key={property.id}
            position={{
              lat: property.latitude,
              lng: property.longitude
            }}
            onClick={() => handlePropertyClick(property.id)}
            icon={{
              path: 'M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24C32 7.163 24.837 0 16 0z',
              fillColor: '#10b981',
              fillOpacity: 1,
              strokeWeight: 3,
              strokeColor: '#ffffff',
              scale: 1.4,
              anchor: new google.maps.Point(16, 40)
            }}
            label={{
              text: `$${Math.round(property.price / 1000000)}M`,
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              className: 'marker-label'
            }}
          />;
        })}
      </GoogleMap>
      
      {/* Barra de control inferior - ocupa todo el ancho */}
      {userLocation && <div className="absolute bottom-0 left-0 right-0 z-[1000]">
          <Card className={`rounded-none border-x-0 border-b-0 border-t-4 border-t-yellow-500 backdrop-blur-md shadow-2xl ${!isPaused ? 'bg-background/30' : 'bg-background/95'}`}>
            <div className="container mx-auto px-6 py-4">
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
                  <div className="bg-background/50 rounded-lg p-3 mb-3 border border-border/50">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-muted-foreground font-medium">Radio de Búsqueda</span>
                        <span className="font-bold text-primary">
                          {searchRadius >= 1000 ? `${(searchRadius / 1000).toFixed(1)} km` : `${searchRadius} m`}
                        </span>
                      </div>
                      <Slider value={[searchRadius]} onValueChange={value => handleManualRadiusChange(value[0])} min={100} max={1000} step={50} className="w-full" />
                    </div>
                  </div>

                  {/* Separador visual */}
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-3" />

                  {/* Información de búsqueda */}
                  <div 
                    className="flex items-center justify-between gap-2 border-2 border-green-500 rounded-lg p-2.5 cursor-pointer hover:bg-accent/10 transition-colors shadow-sm"
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

      {/* Overlay de modo conducción con pantalla bloqueada */}
      {isVehicleMode && (
        <DrivingModeOverlay 
          speed={currentSpeed}
          propertiesCount={collectedProperties.length}
        />
      )}

      {/* Pantalla de revisión de propiedades guardadas */}
      {showCollectedProperties && (
        <SavedPropertiesReview
          properties={collectedProperties}
          userLocation={userLocation}
          onClose={() => {
            setShowCollectedProperties(false);
            setCollectedProperties([]);
            collectedPropertyIds.current.clear();
            travelDistance.current = 0;
          }}
        />
      )}
    </div>;
};
export default NavigationMap;