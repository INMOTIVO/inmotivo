import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { GoogleMap, Marker, Circle, DirectionsRenderer, OverlayView } from '@react-google-maps/api';
import { useGoogleMapsLoader } from '@/hooks/useGoogleMapsLoader';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { X, Navigation, Edit2, MapPin, Car, Search, PersonStanding, Footprints } from 'lucide-react';
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
  isDirectNavigation?: boolean; // When true, shows only route to destination
}
const dynamicRadiusGrowth = (
  distanceMovedMeters: number,
  currentRadius: number
): number => {

  // si no te moviste → no hacer nada
  if (distanceMovedMeters < 5) return currentRadius;

  // escala de crecimiento: 1 metro de movimiento → +2 metros de radio
  const newRadius = currentRadius + distanceMovedMeters * 2;

  // límite entre 200 y 2000 metros
  return Math.min(Math.max(newRadius, 200), 2000);
};



const NavigationMap = ({
  destination,
  filters,
  onStopNavigation,
  searchCriteria = '',
  isDirectNavigation = false
}: NavigationMapProps) => {
  const navigate = useNavigate();
  const [transportMode, setTransportMode] = useState<'driving' | 'walking'>('driving');
  const mapRef = useRef<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  
  const [mapType, setMapType] = useState<google.maps.MapTypeId>(
    google.maps.MapTypeId.ROADMAP
  );

  const [showLayersMenu, setShowLayersMenu] = useState(false);

  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);



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

  // Función para obtener el icono según el tipo de propiedad
  const getPropertyIconSVG = (propertyType: string) => {
    const icons: { [key: string]: string } = {
      'apartamento': `
        <rect x="2" y="4" width="20" height="18" rx="1" stroke="#10b981" stroke-width="2.5" fill="none"/>
        <line x1="2" y1="9" x2="22" y2="9" stroke="#10b981" stroke-width="2"/>
        <line x1="2" y1="14" x2="22" y2="14" stroke="#10b981" stroke-width="2"/>
        <line x1="2" y1="19" x2="22" y2="19" stroke="#10b981" stroke-width="2"/>
        <line x1="8" y1="4" x2="8" y2="22" stroke="#10b981" stroke-width="2"/>
        <line x1="16" y1="4" x2="16" y2="22" stroke="#10b981" stroke-width="2"/>
      `,
      'casa': `
        <path d="M3 12L12 3L21 12" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 12V21H10V16H14V21H19V12" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="7" y="7" width="3" height="3" fill="#10b981"/>
        <rect x="14" y="7" width="3" height="3" fill="#10b981"/>
      `,
      'oficina': `
        <rect x="3" y="3" width="18" height="20" rx="1" stroke="#10b981" stroke-width="2.5" fill="none"/>
        <line x1="3" y1="8" x2="21" y2="8" stroke="#10b981" stroke-width="2"/>
        <line x1="3" y1="13" x2="21" y2="13" stroke="#10b981" stroke-width="2"/>
        <line x1="3" y1="18" x2="21" y2="18" stroke="#10b981" stroke-width="2"/>
        <line x1="9" y1="3" x2="9" y2="23" stroke="#10b981" stroke-width="2"/>
        <line x1="15" y1="3" x2="15" y2="23" stroke="#10b981" stroke-width="2"/>
        <circle cx="6" cy="5.5" r="0.8" fill="#10b981"/>
        <circle cx="12" cy="5.5" r="0.8" fill="#10b981"/>
        <circle cx="18" cy="5.5" r="0.8" fill="#10b981"/>
      `,
      'local': `
        <path d="M4 4H20V9L18 11V22H6V11L4 9V4Z" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
        <rect x="9" y="14" width="6" height="8" fill="#10b981" opacity="0.3"/>
        <path d="M8 14H16M8 17H16" stroke="#10b981" stroke-width="1.5"/>
        <path d="M4 9H20" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/>
      `,
      'lote': `
        <rect x="3" y="3" width="18" height="18" stroke="#10b981" stroke-width="2.5" fill="none" stroke-dasharray="3,2"/>
        <path d="M3 3L21 21M21 3L3 21" stroke="#10b981" stroke-width="1.5" opacity="0.5"/>
        <circle cx="7" cy="7" r="1.5" fill="#10b981"/>
        <circle cx="17" cy="7" r="1.5" fill="#10b981"/>
        <circle cx="7" cy="17" r="1.5" fill="#10b981"/>
        <circle cx="17" cy="17" r="1.5" fill="#10b981"/>
      `,
      'bodega': `
        <rect x="3" y="8" width="18" height="14" rx="1" stroke="#10b981" stroke-width="2.5" fill="none"/>
        <path d="M3 8L12 3L21 8" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
        <rect x="9" y="15" width="6" height="7" stroke="#10b981" stroke-width="2" fill="none"/>
        <line x1="12" y1="15" x2="12" y2="22" stroke="#10b981" stroke-width="2"/>
        <path d="M6 12H9M15 12H18" stroke="#10b981" stroke-width="2" stroke-linecap="round"/>
      `,
      'consultorio': `
        <circle cx="12" cy="12" r="9" stroke="#10b981" stroke-width="2.5" fill="none"/>
        <path d="M12 6V18M6 12H18" stroke="#10b981" stroke-width="3" stroke-linecap="round"/>
      `,
      'default': `
        <rect x="4" y="6" width="16" height="16" rx="1" stroke="#10b981" stroke-width="2.5" fill="none"/>
        <path d="M4 10L12 4L20 10" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
        <rect x="9" y="14" width="6" height="8" fill="#10b981" opacity="0.3"/>
      `
    };

    return icons[propertyType?.toLowerCase()] || icons['default'];
  };
  const {
    isLoaded
  } = useGoogleMapsLoader();

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
  // Skip property fetching when in direct navigation mode
  const {
    data: propertiesGeoJSON,
    refetch: refetchProperties
  } = useQuery({
    queryKey: ['navigation-properties', userLocation, searchRadius, filters],
    queryFn: async () => {
      if (!userLocation || isDirectNavigation) return null; // Don't fetch in direct nav
      
      try {
        const geojson = await getCachedNearbyProperties({
          lat: userLocation.lat,
          lon: userLocation.lng,
          radius: searchRadius,
          priceMax: filters.maxPrice,
          type: filters.propertyType || 'all',
          listingType: filters.listingType || 'rent'
        });
        
        return geojson;
      } catch (error) {
        console.error('Error fetching nearby properties:', error);
        return null; // No mostrar toast en cada error
      }
    },
    enabled: !!userLocation && !isPaused && !isDirectNavigation,
    refetchInterval: false,
    staleTime: isVehicleMode ? 20000 : 60000, // Caché mucho más largo para móvil
    gcTime: 600000 // Mantener en caché 10 minutos
  });

  // Convert GeoJSON to properties array - Limitado para mejor rendimiento en móvil
  const properties = propertiesGeoJSON?.features
    ?.slice(0, isVehicleMode ? 5 : 10) // Reducir marcadores significativamente en móvil
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
    const UPDATE_INTERVAL = isVehicleMode ? 3000 : 8000; // Reducir frecuencia significativamente
    
    watchId = navigator.geolocation.watchPosition(position => {
      
      
      if (isPaused) return;
      const now = Date.now();
      if (now - lastUpdate < UPDATE_INTERVAL) return;
      
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

      // ===============================
      // 🔥 RADIO DINÁMICO MIENTRAS TE MUEVES
      // ===============================
      if (previousLocation.current) {
        const moved = calculateDistance(
          previousLocation.current.lat,
          previousLocation.current.lng,
          newLocation.lat,
          newLocation.lng
        ) * 1000; // km → metros

        const updatedRadius = dynamicRadiusGrowth(moved, searchRadius);
        setSearchRadius(updatedRadius);
      }

      updateDynamicRadius(newLocation)
      // Usar heading del GPS si está disponible, sino usar el calculado
      if (position.coords.heading !== null && position.coords.heading >= 0) {
        const gpsHeading = position.coords.heading;
        smoothHeading.current = gpsHeading;
        setHeading(gpsHeading);
      } else if (calculatedHeading !== heading) {
        setHeading(smoothHeading.current);
      }
      
    // CONTROL TOTAL DEL MAPA (modo Waze real)
    if (mapRef.current) {

      // 1. Seguir SIEMPRE la ubicación del usuario (pan + snap)
      const lastPos = mapRef.current.getCenter();
      const dist = lastPos
        ? calculateDistance(lastPos.lat(), lastPos.lng(), newLocation.lat, newLocation.lng)
        : 0;

      // Si hay un cambio mayor a ~3 metros, mover suavemente
      if (dist > 0.003) {
        mapRef.current.panTo(newLocation);
      } else {
        mapRef.current.setCenter(newLocation);
      }

      // 2. Rotar el mapa según heading suavizado
      if (!isPaused) {
        mapRef.current.setHeading(smoothHeading.current);

        // Zoom dinámico:
        // - Si vas rápido → más lejos
        // - Si vas lento → más cerca
        if (currentSpeed > 35) mapRef.current.setTilt(60);
        else if (currentSpeed > 15) mapRef.current.setTilt(50);
        else mapRef.current.setTilt(40);
      }

      // 3. Si está pausado → volver al modo normal
      if (isPaused) {
        mapRef.current.setHeading(0);
        mapRef.current.setTilt(0);
      }
    }



    }, error => {
      console.error('Geolocation error:', error);
      if (error.code === 1) {
        toast.error('Permiso de ubicación denegado', {
          id: 'geo-error'
        });
      }
    }, {
      enableHighAccuracy: false, // Usar GPS menos preciso pero más rápido en móvil
      maximumAge: 5000, // Permitir caché de 5 segundos
      timeout: 15000 // Timeout más largo
    });
    
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isPaused, isVehicleMode, collectedProperties.length, heading]);
  
  const updateDynamicRadius = async (newLocation: { lat: number; lng: number }) => {
    try {
      const geocoder = new google.maps.Geocoder();

      const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ location: newLocation }, (res, status) => {
          if (status === "OK" && res) resolve(res);
          else reject(status);
        });
      });

      if (!results || !results[0]) return;

      const viewport = results[0].geometry.viewport;
      if (!viewport) return;

      const ne = viewport.getNorthEast();
      const sw = viewport.getSouthWest();

      // Cálculo del tamaño del sector (diagonal del viewport)
      const width = calculateDistance(ne.lat(), sw.lng(), ne.lat(), ne.lng());  // km
      const height = calculateDistance(ne.lat(), ne.lng(), sw.lat(), ne.lng()); // km

      const diagonalKm = Math.sqrt(width * width + height * height);

      // Radio = mitad del tamaño del sector
      const radiusMeters = (diagonalKm * 1000) / 2;

      // Límite mínimo/máximo
      const bounded = Math.max(150, Math.min(radiusMeters, 4000));

      setSearchRadius(bounded);
    } catch (error) {
      console.error("Error actualizando radio dinámico:", error);
    }
  };

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

    const directionsService = new google.maps.DirectionsService();

    directionsService.route({
      origin: userLocation,
      destination: {
        lat: destination[0],
        lng: destination[1]
      },
      travelMode:
        transportMode === "walking"
          ? google.maps.TravelMode.WALKING
          : google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        setDirections(result);
      }
    });
  }, [userLocation, destination, isPaused, isLoaded, transportMode]);



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
      trafficLayerRef.current = new google.maps.TrafficLayer();

      // In direct navigation mode, fit bounds to show entire route
      if (isDirectNavigation && directions && userLocation) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(userLocation);
        bounds.extend({ lat: destination[0], lng: destination[1] });
        map.fitBounds(bounds, { top: 100, right: 50, bottom: 250, left: 50 });
      }
    }} onZoomChanged={handleZoomChanged} options={{
      mapTypeId: mapType,
      zoomControl: false,
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
                  
              {directions ? (
                transportMode === "walking" ? (
                  // 👣 HUELLAS EN MODO CAMINAR
                  <svg 
                    width="48" 
                    height="48" 
                    viewBox="0 0 24 24" 
                    style={{
                      transform: `rotate(${heading}deg)`,
                      transition: "transform 0.3s",
                      position: "relative",
                      zIndex: 10,
                      filter: "drop-shadow(0 8px 16px rgba(30,58,138,0.6))",
                    }}
                  >
                    {/* Huella izquierda */}
                    <path 
                      d="M7 4C6 6 5 7 5 9c0 1 1 2 2 2s2-1 2-2c0-2-1-3-2-5z" 
                      fill="#1d4ed8"
                    />
                    
                    {/* Huella derecha */}
                    <path 
                      d="M17 4c-1 2-2 3-2 5 0 1 1 2 2 2s2-1 2-2c0-2-1-3-2-5z" 
                      fill="#1d4ed8"
                    />

                    {/* Puntos de apoyo */}
                    <circle cx="7" cy="13" r="2" fill="#1d4ed8"/>
                    <circle cx="17" cy="13" r="2" fill="#1d4ed8"/>
                  </svg>
                ) : (
                  // 🟢 FLECHA EN MODO CARRO
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" style={{
                    filter: 'drop-shadow(0 8px 20px rgba(34, 197, 94, 0.7))',
                    position: 'relative',
                    zIndex: 10,
                    transform: `rotate(${heading}deg)`,
                    transition: 'transform 0.3s ease-out'
                  }}>
                    <path d="M12 2L4 20L12 16L20 20L12 2Z" fill="rgba(0,0,0,0.2)" transform="translate(0, 1)" />
                    <path d="M12 2L4 20L12 16L20 20L12 2Z" fill="url(#arrowGradient)" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                    <path d="M12 2L12 14" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
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
                  </svg>
                )
              ) : (
                // 📍 PIN CUANDO NO HAY NAVEGACIÓN
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{
                  filter: 'drop-shadow(0 8px 16px rgba(34, 197, 94, 0.6))',
                  position: 'relative',
                  zIndex: 10
                }}>
                  <circle cx="12" cy="10" r="7" fill="url(#glow)" opacity="0.4" />
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="url(#gradient)" stroke="white" strokeWidth="1.5" />
                  <circle cx="12" cy="9" r="3" fill="white">
                    <animate attributeName="r" values="3;3.5;3" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0.8;1" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                </svg>
              )}

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

            {/* Search radius circle - only in GPS mode */}
            {!isDirectNavigation && (
              <Circle center={userLocation} radius={searchRadius} options={{
                strokeColor: '#8b5cf6',
                strokeOpacity: 1,
                strokeWeight: 3,
                fillColor: '#a78bfa',
                fillOpacity: 0.15
              }} />
            )}
          </>}



        {/* Directions renderer for direct navigation */}
        {isDirectNavigation && directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: true,
            polylineOptions:
              transportMode === "walking"
                ? {
                    strokeColor: "#16a34a",
                    strokeWeight: 5,
                    strokeOpacity: 0,
                    icons: [
                      {
                        icon: {
                          path: google.maps.SymbolPath.CIRCLE,
                          scale: 4,
                          fillColor: "#16a34a",
                          fillOpacity: 1,
                          strokeOpacity: 0,
                        },
                        offset: "0",
                        repeat: "12px",
                      },
                    ],
                  }
                : {
                    strokeColor: "#3b82f6",
                    strokeWeight: 6,
                    strokeOpacity: 0.9,
                  },
          }}
        />


        )}
        
        {/* Destination marker in direct navigation mode */}
        {isDirectNavigation && (
          <Marker
            position={{ lat: destination[0], lng: destination[1] }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
              scale: 12,
            }}
            label={{
              text: searchCriteria || 'Destino',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold',
              className: 'bg-red-500 px-2 py-1 rounded shadow-lg'
            }}
          />
        )}

        {/* Property markers - Only in GPS navigation mode */}
        {!isPaused && !isDirectNavigation && properties?.map(property => {
          if (!property.latitude || !property.longitude) return null;
          
          // Crear SVG con círculo verde titilante
          const svgMarker = `
            <svg width="56" height="72" viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg">
      
              <ellipse cx="16" cy="46" rx="8" ry="2" fill="rgba(0,0,0,0.3)"/>
              
        
              <defs>
                <linearGradient id="pinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#22c55e;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#16a34a;stop-opacity:1" />
                </linearGradient>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.4"/>
                </filter>
              </defs>
              
              <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24C32 7.163 24.837 0 16 0z" 
                    fill="url(#pinGrad)" 
                    stroke="#ffffff" 
                    stroke-width="2.5"
                    filter="url(#shadow)"/>

              <circle cx="16" cy="14" r="9" fill="white" opacity="0.98"/>
              

              <circle cx="16" cy="14" r="5" fill="#22c55e">
                <animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite"/>
              </circle>
              

              <circle cx="16" cy="14" r="5" fill="none" stroke="#22c55e" stroke-width="1.5">
                <animate attributeName="r" values="5;8;5" dur="1.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0;0.8" dur="1.5s" repeatCount="indefinite"/>
              </circle>
              

              <rect x="2" y="27" width="28" height="13" rx="6.5" 
                    fill="#ffffff" 
                    stroke="#16a34a" 
                    stroke-width="2"
                    filter="url(#shadow)"/>
              <text x="16" y="36" 
                    font-size="8" 
                    font-weight="900" 
                    fill="#16a34a" 
                    text-anchor="middle" 
                    font-family="system-ui, -apple-system, sans-serif">
                $${Math.round(property.price / 1000000)}M
              </text>
            </svg>
          `;
          
          const icon = {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarker)}`,
            scaledSize: new google.maps.Size(48, 64),
            anchor: new google.maps.Point(24, 64)
          };
          
          return <Marker 
            key={property.id}
            position={{
              lat: property.latitude,
              lng: property.longitude
            }}
            onClick={() => handlePropertyClick(property.id)}
            icon={icon}
          />;
        })}
      </GoogleMap>
      
      {/* === ZOOM CONTROL FIJO DENTRO DEL MAPA === */}
      <div
        className="
          absolute 
          z-[1200]
          top-[calc(env(safe-area-inset-top)+72px)]
          right-4
          flex flex-col gap-2
          pointer-events-auto
        "
      >
        {/* + */}
        <button
          onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() + 1)}
          className="
            h-12 w-12 
            bg-white rounded-xl border border-gray-200
            shadow-[0_2px_10px_rgba(0,0,0,0.15)]
            flex items-center justify-center 
            text-gray-700 text-xl font-bold
            active:scale-95 transition
          "
        >
          +
        </button>

        {/* − */}
        <button
          onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() - 1)}
          className="
            h-12 w-12 
            bg-white rounded-xl border border-gray-200
            shadow-[0_2px_10px_rgba(0,0,0,0.15)]
            flex items-center justify-center 
            text-gray-700 text-2xl font-bold
            active:scale-95 transition
          "
        >
          −
        </button>

        {/* === BOTÓN DE CAPAS (debajo del menos) === */}
        <button
          onClick={() => setShowLayersMenu(!showLayersMenu)}
          className="
            h-12 w-12 mt-1
            rounded-xl 
            bg-white 
            shadow-xl
            border border-gray-200 
            flex items-center justify-center
            active:scale-95 transition
          "
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="#374151" strokeWidth="2">
            <path d="m12 3 8 4-8 4-8-4z"/>
            <path d="m4 12 8 4 8-4"/>
            <path d="m4 17 8 4 8-4"/>
          </svg>
        </button>

{/* === MENÚ === */}
{showLayersMenu && (
  <div
    className="
      absolute right-14 top-[88px]
      w-52 bg-white 
      rounded-2xl p-3 
      shadow-2xl border border-gray-200
      backdrop-blur-md
      animate-in fade-in zoom-in duration-150
      z-[2001]
    "
  >
    {/* MAPA ESTÁNDAR */}
    <button
      onClick={() => {
        setMapType(google.maps.MapTypeId.ROADMAP);
        setShowLayersMenu(false);
      }}
      className={`
        flex items-center gap-3 p-2 mb-2 rounded-xl w-full transition
        ${mapType === google.maps.MapTypeId.ROADMAP
          ? "bg-blue-50 border border-blue-300 shadow-md"
          : "hover:bg-gray-100"
        }
      `}
    >
      <img
        src="/src/assets/ESTANDAR.png"
        className="
          h-10 w-10 
          rounded-xl 
          object-cover 
          border border-gray-300
          shadow-sm
        "
      />
      <span
        className={`
          font-medium
          ${mapType === google.maps.MapTypeId.ROADMAP ? "text-blue-700" : "text-gray-700"}
        `}
      >
        Estándar
      </span>
    </button>

    {/* SATÉLITE */}
    <button
      onClick={() => {
        setMapType(google.maps.MapTypeId.HYBRID);
        setShowLayersMenu(false);
      }}
      className={`
        flex items-center gap-3 p-2 rounded-xl w-full transition
        ${mapType === google.maps.MapTypeId.HYBRID
          ? "bg-blue-50 border border-blue-300 shadow-md"
          : "hover:bg-gray-100"
        }
      `}
    >
      <img
        src="/src/assets/SATELITE.png"
        className="
          h-10 w-10 
          rounded-xl 
          object-cover 
          border border-gray-300
          shadow-sm
        "
      />
      <span
        className={`
          font-medium
          ${mapType === google.maps.MapTypeId.HYBRID ? "text-blue-700" : "text-gray-700"}
        `}
      >
        Satélite
      </span>
    </button>
  </div>
)}

      </div>




      {/* Barra de control inferior - ocupa todo el ancho */}
      {userLocation && (
        <div className="absolute bottom-4 left-0 right-0 z-[1000] px-4">
          <div
            className={`
              w-full max-w-xl mx-auto 
              rounded-3xl shadow-xl 
              backdrop-blur-xl
              transition-all duration-300
              ${isDirectNavigation ? 'bg-white/80 border border-blue-300/50' : 'bg-white/70 border border-gray-300/40'}
            `}
          >
            <div className="px-5 py-4 space-y-4">

              {/* ====== MODO DE TRANSPORTE ====== */}
              <div className="flex items-center justify-center gap-4">
                
                {/* 🚗 CAR */}
                <button
                  onClick={() => setTransportMode("driving")}
                  className={`
                    h-12 w-12 flex items-center justify-center rounded-full
                    transition-all duration-200 shadow-sm
                    ${transportMode === "driving"
                      ? "bg-blue-600 text-white scale-110 shadow-md"
                      : "bg-white text-blue-600 border border-blue-300/40 hover:bg-blue-100"
                    }
                  `}
                >
                  <Car className="h-6 w-6" />
                </button>

                {/* 🚶 WALK */}
                <button
                  onClick={() => setTransportMode("walking")}
                  className={`
                    h-12 w-12 flex items-center justify-center rounded-full
                    transition-all duration-200 shadow-sm
                    ${transportMode === "walking"
                      ? "bg-green-600 text-white scale-110 shadow-md"
                      : "bg-white text-green-600 border border-green-300/40 hover:bg-green-100"
                    }
                  `}
                >
                  <Footprints className="h-6 w-6" />
                </button>


              </div>


              {/* ====== TARJETA DE TIEMPO (ESTILO GOOGLE MAPS) ====== */}
              {isDirectNavigation && directions && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/90 border border-gray-200 shadow-sm">
                  
                  <div className="flex items-center gap-3 min-w-0">
                    <Navigation className="h-5 w-5 text-blue-600" />

                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {directions.routes[0].legs[0].duration?.text} · {directions.routes[0].legs[0].distance?.text}
                      </span>

                      <span className="text-xs text-gray-500 truncate max-w-[200px]">
                        {searchCriteria}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={onStopNavigation}
                    className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-red-100 text-red-500 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>

                </div>
              )}


              {/* ====== MODO GPS NORMAL ====== */}
              {!isDirectNavigation && (
                <div className="space-y-4">

                  {/* Botón Pausar / Reanudar */}
                  <button
                    onClick={handleToggleNavigation}
                    className={`
                      w-full py-3 rounded-xl text-white font-semibold shadow-md
                      transition-all duration-200
                      ${isPaused
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-500 hover:bg-red-600"
                      }
                    `}
                  >
                    {isPaused ? "Reanudar Navegación" : "Detener"}
                  </button>

                  {/* Card del radio */}
                  <div className="bg-white/70 border border-gray-300/40 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-600">Radio de búsqueda</span>
                      <span className="font-bold text-gray-900">
                        {searchRadius >= 1000
                          ? `${(searchRadius / 1000).toFixed(1)} km`
                          : `${searchRadius} m`}
                      </span>
                    </div>

                    {/* Slider ultrafino estilo iOS */}
                    <Slider
                      value={[searchRadius]}
                      min={100}
                      max={2000}
                      step={50}
                      onValueChange={(v) => handleManualRadiusChange(v[0])}
                      className="h-1"
                    />
                  </div>

                  {/* Buscar */}
                  <div
                    onClick={() => { setEditSearchQuery(searchCriteria); setIsEditDialogOpen(true); }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-green-500/40 shadow-sm hover:bg-green-50 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Search className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium truncate">
                        {searchCriteria || "Propiedades cerca"}
                      </p>
                    </div>
                    <Edit2 className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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