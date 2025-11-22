import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { GoogleMap, Marker, Circle, DirectionsRenderer, OverlayView } from "@react-google-maps/api";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { X, Navigation, Edit2, MapPin, Car, Search, PersonStanding, Footprints } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { playNotificationSound } from "@/utils/notificationSound";
import { DrivingModeOverlay } from "./DrivingModeOverlay";
import { SavedPropertiesReview } from "./SavedPropertiesReview";
import { getCachedNearbyProperties, fetchRouteProperties, encodePolylineToGeoJSON } from "@/utils/navigationAPI";
import { calculateScore } from "@/utils/mapHelpers";
import { showPropertyAlert, requestNotificationPermission } from "@/utils/notificationManager";
import { debounce } from "@/utils/mapHelpers";
import { useLocation } from "react-router-dom";

interface NavigationMapProps {
  destination: [number, number];
  filters: any;
  onStopNavigation: () => void;
  searchCriteria?: string;
  isDirectNavigation?: boolean; // When true, shows only route to destination
  isUsingCurrentLocation?: boolean; // When true, user is using GPS location
}
const dynamicRadiusGrowth = (distanceMovedMeters: number, currentRadius: number): number => {
  // Si no te moviste → no hacer nada
  if (distanceMovedMeters < 5) return currentRadius;

  // Escala de crecimiento: 1 metro → +2 metros de radio
  const newRadius = currentRadius + distanceMovedMeters * 2;

  // SIN LÍMITES - dejar que crezca naturalmente (solo mínimo de 100m)
  return Math.max(newRadius, 100);
};

const NavigationMap = ({
  destination,
  filters,
  onStopNavigation,
  searchCriteria = "",
  isDirectNavigation = false,
  isUsingCurrentLocation = true, // Default true para retrocompatibilidad
}: NavigationMapProps) => {
  // Load Google Maps first (must be before any other hooks)
  const { isLoaded } = useGoogleMapsLoader();

  const navigate = useNavigate();
  const [transportMode, setTransportMode] = useState<"driving" | "walking">("driving");
  const mapRef = useRef<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [initialCenter, setInitialCenter] = useState<{ lat: number; lng: number } | null>(null);

  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");

  const [showLayersMenu, setShowLayersMenu] = useState(false);

  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);

  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const manualLat = params.get("lat");
  const manualLng = params.get("lng");

  const hasManualLocation = manualLat && manualLng;

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
  const [routeDistance, setRouteDistance] = useState<string | null>(null);
  const [routeDuration, setRouteDuration] = useState<string | null>(null);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Estados de navegación (nuevos)
  const [isDriving, setIsDriving] = useState(false);
  const [isNavigationMode, setIsNavigationMode] = useState(false);
  const [hasStartedNavigation, setHasStartedNavigation] = useState(false);
  const [initialUserLocation, setInitialUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Cola de velocidades para calcular promedio de 2 minutos (cambio de 3 a 2)
  const speedSamples = useRef<{ speed: number; timestamp: number }[]>([]);
  const [avgSpeed2Min, setAvgSpeed2Min] = useState<number>(0);
  const [showDrivingModal, setShowDrivingModal] = useState(false);

  // Nuevos estados para sistema de recarga dinámica
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [isAtWheel, setIsAtWheel] = useState(false); // ¿Estás conduciendo?
  const [showWheelModal, setShowWheelModal] = useState(false);
  const lastFetchPosition = useRef<{ lat: number; lng: number } | null>(null);

  // Memoizar funciones para evitar re-renders
  const handlePropertyClick = useCallback(
    (propertyId: string) => {
      navigate(`/property/${propertyId}`);
    },
    [navigate],
  );

  // Función para calcular distancia entre dos puntos (Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Función para obtener el icono según el tipo de propiedad
  const getPropertyIconSVG = (propertyType: string) => {
    const icons: { [key: string]: string } = {
      apartamento: `
        <rect x="2" y="4" width="20" height="18" rx="1" stroke="#10b981" stroke-width="2.5" fill="none"/>
        <line x1="2" y1="9" x2="22" y2="9" stroke="#10b981" stroke-width="2"/>
        <line x1="2" y1="14" x2="22" y2="14" stroke="#10b981" stroke-width="2"/>
        <line x1="2" y1="19" x2="22" y2="19" stroke="#10b981" stroke-width="2"/>
        <line x1="8" y1="4" x2="8" y2="22" stroke="#10b981" stroke-width="2"/>
        <line x1="16" y1="4" x2="16" y2="22" stroke="#10b981" stroke-width="2"/>
      `,
      casa: `
        <path d="M3 12L12 3L21 12" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 12V21H10V16H14V21H19V12" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="7" y="7" width="3" height="3" fill="#10b981"/>
        <rect x="14" y="7" width="3" height="3" fill="#10b981"/>
      `,
      oficina: `
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
      local: `
        <path d="M4 4H20V9L18 11V22H6V11L4 9V4Z" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
        <rect x="9" y="14" width="6" height="8" fill="#10b981" opacity="0.3"/>
        <path d="M8 14H16M8 17H16" stroke="#10b981" stroke-width="1.5"/>
        <path d="M4 9H20" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/>
      `,
      lote: `
        <rect x="3" y="3" width="18" height="18" stroke="#10b981" stroke-width="2.5" fill="none" stroke-dasharray="3,2"/>
        <path d="M3 3L21 21M21 3L3 21" stroke="#10b981" stroke-width="1.5" opacity="0.5"/>
        <circle cx="7" cy="7" r="1.5" fill="#10b981"/>
        <circle cx="17" cy="7" r="1.5" fill="#10b981"/>
        <circle cx="7" cy="17" r="1.5" fill="#10b981"/>
        <circle cx="17" cy="17" r="1.5" fill="#10b981"/>
      `,
      bodega: `
        <rect x="3" y="8" width="18" height="14" rx="1" stroke="#10b981" stroke-width="2.5" fill="none"/>
        <path d="M3 8L12 3L21 8" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
        <rect x="9" y="15" width="6" height="7" stroke="#10b981" stroke-width="2" fill="none"/>
        <line x1="12" y1="15" x2="12" y2="22" stroke="#10b981" stroke-width="2"/>
        <path d="M6 12H9M15 12H18" stroke="#10b981" stroke-width="2" stroke-linecap="round"/>
      `,
      consultorio: `
        <circle cx="12" cy="12" r="9" stroke="#10b981" stroke-width="2.5" fill="none"/>
        <path d="M12 6V18M6 12H18" stroke="#10b981" stroke-width="3" stroke-linecap="round"/>
      `,
      default: `
        <rect x="4" y="6" width="16" height="16" rx="1" stroke="#10b981" stroke-width="2.5" fill="none"/>
        <path d="M4 10L12 4L20 10" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
        <rect x="9" y="14" width="6" height="8" fill="#10b981" opacity="0.3"/>
      `,
    };

    return icons[propertyType?.toLowerCase()] || icons["default"];
  };

  // Calcular radio dinámico del viewport
  const calculateViewportRadius = useCallback((ne: google.maps.LatLng, sw: google.maps.LatLng): number => {
    const width = calculateDistance(ne.lat(), sw.lng(), ne.lat(), ne.lng());
    const height = calculateDistance(ne.lat(), ne.lng(), sw.lat(), ne.lng());
    const diagonal = Math.sqrt(width * width + height * height);
    const radiusKm = (diagonal / 2) * 1.2;
    const radiusMeters = radiusKm * 1000;
    return Math.round(radiusMeters);
  }, []);

  // Convertir zoom a radio de búsqueda (legacy)
  const zoomToRadius = (zoom: number): number => {
    if (zoom >= 19) return 100;
    if (zoom >= 18) return 200;
    if (zoom >= 17) return 300;
    if (zoom >= 16) return 500;
    if (zoom >= 15) return 750;
    return 1000;
  };

  useEffect(() => {
    if (userLocation && !searchCenter) {
      setSearchCenter(userLocation);
    }
  }, [userLocation]);

  // Sincronizar radio con zoom cuando no sea cambio manual
  useEffect(() => {
    if (!isManualRadiusChange.current) {
      const newRadius = zoomToRadius(mapZoom);
      setSearchRadius(newRadius);
    }
    isManualRadiusChange.current = false;
  }, [mapZoom]);
  const [isUserPanning, setIsUserPanning] = useState(false);
  const userPanTimeout = useRef<any>(null);

  // Manejar cambios manuales en el radio
  const handleManualRadiusChange = (value: number) => {
    isManualRadiusChange.current = true;
    setSearchRadius(value);

    // Ajustar zoom del mapa según el radio manual
    if (mapRef.current) {
      let targetZoom = 17;
      if (value <= 100) targetZoom = 19;
      else if (value <= 200) targetZoom = 18;
      else if (value <= 300) targetZoom = 17;
      else if (value <= 500) targetZoom = 16;
      else if (value <= 750) targetZoom = 15;
      else targetZoom = 14;
      mapRef.current.setZoom(targetZoom);
    }

    loadPropertiesInViewport(); // ⬅️ Recargar con nuevo radio
  };
  const formatPrice = (price: number) => {
    if (!price) return "";

    // Menos de 1 millón → K
    if (price < 1_000_000) {
      return `$${Math.round(price / 1000)}K`;
    }

    // 1 millón o más → M con 1 decimal
    return `$${(price / 1_000_000).toFixed(1)}M`;
  };

  // Fetch properties using new API - Sistema de recarga dinámica
  const { data: propertiesGeoJSON, refetch: refetchProperties } = useQuery({
    queryKey: ["navigation-properties", mapBounds, searchRadius, filters],
    queryFn: async () => {
      if (!searchCenter || isDirectNavigation) return null;

      try {
        let params: any = {
          lat: searchCenter.lat,
          lon: searchCenter.lng,
          radius: searchRadius,
          priceMax: filters.maxPrice,
          type: filters.propertyType || "all",
          listingType: filters.listingType || "rent",
        };

        // Si hay bounds, enviarlos al edge function
        if (mapBounds) {
          const ne = mapBounds.getNorthEast();
          const sw = mapBounds.getSouthWest();

          params = {
            ...params,
            neLat: ne.lat(),
            neLng: ne.lng(),
            swLat: sw.lat(),
            swLng: sw.lng(),
          };
        }

        const geojson = await getCachedNearbyProperties(params);
        return geojson;
      } catch (error) {
        console.error("Error fetching nearby properties:", error);
        return null;
      }
    },
    enabled: !!searchCenter && !isPaused && !isDirectNavigation,
    refetchInterval: false,
    staleTime: 5000,
    gcTime: 300000,
  });

  // Función de recarga dinámica (DESPUÉS de refetchProperties)
  const loadPropertiesInViewport = useCallback(async () => {
    if (!mapRef.current || isDirectNavigation || isPaused) return;

    const bounds = mapRef.current.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const center = bounds.getCenter();

    const radiusMeters = calculateViewportRadius(ne, sw);

    console.log("Loading properties in viewport:", {
      ne: { lat: ne.lat(), lng: ne.lng() },
      sw: { lat: sw.lat(), lng: sw.lng() },
      radius: radiusMeters,
    });

    setSearchCenter({ lat: center.lat(), lng: center.lng() });
    setMapBounds(bounds);
    setSearchRadius(radiusMeters);

    refetchProperties();
  }, [isDirectNavigation, isPaused, refetchProperties, calculateViewportRadius]);

  // Manejar cambios en el zoom del mapa
  const handleZoomChanged = () => {
    if (mapRef.current) {
      const zoom = mapRef.current.getZoom();
      if (zoom !== undefined) {
        setMapZoom(zoom);
        loadPropertiesInViewport();
      }
    }
  };

  // Convert GeoJSON to properties array - SIN límite artificial
  const properties =
    propertiesGeoJSON?.features?.map((feature: any) => ({
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
      distance_km: feature.properties.distance_km,
    })) || [];

  // Establecer centro inicial solo una vez
  useEffect(() => {
    if (initialCenter) return; // Ya establecido

    // PRIORIDAD 1: Ubicación manual desde URL
    if (hasManualLocation && manualLat && manualLng) {
      setInitialCenter({ lat: Number(manualLat), lng: Number(manualLng) });
      console.log("Centro inicial: Ubicación manual", { lat: manualLat, lng: manualLng });
    }
    // PRIORIDAD 2: Ubicación GPS del usuario
    else if (userLocation) {
      setInitialCenter(userLocation);
      console.log("Centro inicial: GPS del usuario", userLocation);
    }
  }, [userLocation, hasManualLocation, manualLat, manualLng, initialCenter]);

  // Track user location and speed - Optimizado para móvil
  useEffect(() => {
    let watchId: number;
    let lastUpdate = 0;
    const UPDATE_INTERVAL = isVehicleMode ? 1200 : 2000;

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

        // Calcular velocidad y heading desde movimiento
        let speed = 0;
        let calculatedHeading = heading;

        if (previousLocation.current) {
          const timeDiff = (now - previousLocation.current.time) / 1000 / 3600; // en horas
          const distance = calculateDistance(
            previousLocation.current.lat,
            previousLocation.current.lng,
            newLocation.lat,
            newLocation.lng,
          ); // en km

          speed = distance / timeDiff; // km/h
          setCurrentSpeed(speed);

          // Agregar velocidad al historial (cambio a 2 minutos)
          speedSamples.current.push({ speed, timestamp: now });

          // Filtrar historial: solo últimos 2 minutos (NO 3)
          const twoMinutesAgo = now - 2 * 60 * 1000;
          speedSamples.current = speedSamples.current.filter((entry) => entry.timestamp >= twoMinutesAgo);

          // Calcular velocidad promedio de 2 minutos
          if (speedSamples.current.length > 0) {
            const totalSpeed = speedSamples.current.reduce((sum, entry) => sum + entry.speed, 0);
            const avg = totalSpeed / speedSamples.current.length;
            setAvgSpeed2Min(avg);
          }

          // Calcular heading basado en el movimiento real
          const dLat = newLocation.lat - previousLocation.current.lat;
          const dLng = newLocation.lng - previousLocation.current.lng;

          // Solo calcular nuevo heading si hay movimiento significativo
          if (Math.abs(dLat) > 0.00001 || Math.abs(dLng) > 0.00001) {
            // Calcular bearing (rumbo) desde el punto anterior al nuevo
            // Norte = 0°, Este = 90°, Sur = 180°, Oeste = 270°
            let angle = (Math.atan2(dLng, dLat) * 180) / Math.PI;

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

            // Si se movió más de 60 metros, recargar propiedades
            const movedMeters = distance * 1000;
            if (movedMeters > 60) {
              loadPropertiesInViewport();
              lastFetchPosition.current = newLocation;
            }

            // Limitar a 2km de registro
            if (travelDistance.current > 2) {
              collectedPropertyIds.current.clear();
              setCollectedProperties([]);
              travelDistance.current = 0;
            }
          }
        }

        // Detectar conducción automática: velocidad promedio > 10 km/h en 2 minutos
        if (avgSpeed2Min > 10 && !isDriving && !hasStartedNavigation && isUsingCurrentLocation) {
          setIsDriving(true);
          setIsNavigationMode(true);
          setHasStartedNavigation(true);
          setIsVehicleMode(true);
          travelDistance.current = 0;
          collectedPropertyIds.current.clear();
          setCollectedProperties([]);

          toast.info("Modo conducción activado automáticamente", {
            description: `Velocidad promedio: ${Math.round(avgSpeed2Min)} km/h`,
            duration: 4000,
          });
        }
        // Desactivar si velocidad baja de 10 km/h por más de 2 minutos
        else if (avgSpeed2Min <= 10 && isDriving && hasStartedNavigation) {
          const belowThresholdSamples = speedSamples.current.filter((s) => s.speed <= 10);
          const timeBelow = belowThresholdSamples.length > 0 ? (now - belowThresholdSamples[0].timestamp) / 1000 : 0;

          if (timeBelow >= 120) {
            // 2 minutos = 120 segundos
            setIsDriving(false);
            setIsNavigationMode(false);
            setIsVehicleMode(false);

            toast.info("Modo conducción desactivado", {
              description: "Velocidad reducida detectada",
              duration: 3000,
            });

            if (collectedProperties.length > 0) {
              setShowCollectedProperties(true);
            }
          }
        }

        previousLocation.current = { lat: newLocation.lat, lng: newLocation.lng, time: now };
        setUserLocation(newLocation);

        // Guardar ubicación inicial solo una vez
        if (!initialUserLocation && isUsingCurrentLocation) {
          setInitialUserLocation(newLocation);
        }

        // ===============================
        // 🔥 RADIO DINÁMICO MIENTRAS TE MUEVES
        // ===============================
        if (previousLocation.current) {
          const moved =
            calculateDistance(
              previousLocation.current.lat,
              previousLocation.current.lng,
              newLocation.lat,
              newLocation.lng,
            ) * 1000; // km → metros

          const updatedRadius = dynamicRadiusGrowth(moved, searchRadius);
          setSearchRadius(updatedRadius);
        }

        // Ajustar solo un poco el radio según movimiento, sin geocoder
        const movedMeters =
          calculateDistance(
            previousLocation.current.lat,
            previousLocation.current.lng,
            newLocation.lat,
            newLocation.lng,
          ) * 1000;

        if (movedMeters > 3) {
          setSearchRadius((prev) => {
            const next = prev + movedMeters * 1.5; // suave y liviano
            return Math.min(Math.max(next, 150), 2000);
          });
        }

        // CONTROL DEL MAPA - Solo en modo navegación activa
        if (mapRef.current && isUsingCurrentLocation) {
          // Solo recentrar automáticamente si TODAS estas condiciones se cumplen:
          // 1. NO está arrastrando manualmente
          // 2. Está en modo conducción
          // 3. Ha iniciado navegación
          // 4. Está usando ubicación GPS actual (no manual)
          if (!isUserPanning && isDriving && hasStartedNavigation && isUsingCurrentLocation) {
            const lastPos = mapRef.current.getCenter();
            const dist = lastPos
              ? calculateDistance(lastPos.lat(), lastPos.lng(), newLocation.lat, newLocation.lng)
              : 0;

            if (dist > 0.003) {
              mapRef.current.panTo(newLocation);
            } else {
              mapRef.current.setCenter(newLocation);
            }
          }

          // Rotar el mapa y ajustar tilt solo en modo conducción
          if (isDriving && hasStartedNavigation && !isPaused) {
            mapRef.current.setHeading(smoothHeading.current);

            if (currentSpeed > 35) mapRef.current.setTilt(60);
            else if (currentSpeed > 15) mapRef.current.setTilt(50);
            else mapRef.current.setTilt(40);
          }
          // Modo pasivo: mapa plano sin rotación
          else {
            mapRef.current.setHeading(0);
            mapRef.current.setTilt(0);
          }
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        if (error.code === 1) {
          toast.error("Permiso de ubicación denegado", {
            id: "geo-error",
          });
        }
      },
      {
        enableHighAccuracy: false, // Usar GPS menos preciso pero más rápido en móvil
        maximumAge: 5000, // Permitir caché de 5 segundos
        timeout: 15000, // Timeout más largo
      },
    );

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isPaused, isDriving, hasStartedNavigation, collectedProperties.length, heading]);

  // Función para iniciar conducción manual
  const handleStartDriving = () => {
    setIsDriving(true);
    setIsNavigationMode(true);
    setHasStartedNavigation(true);
    setIsVehicleMode(true);
    setShowDrivingModal(false);
    travelDistance.current = 0;
    collectedPropertyIds.current.clear();
    setCollectedProperties([]);

    toast.success("Navegación iniciada", {
      description: "Las propiedades cercanas se guardarán automáticamente",
      duration: 3000,
    });
  };

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
      const width = calculateDistance(ne.lat(), sw.lng(), ne.lat(), ne.lng()); // km
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

  // Calculate directions - Optimizado para actualizar menos frecuentemente
  useEffect(() => {
    if (!userLocation || !isLoaded || isPaused) return;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: userLocation,
        destination: {
          lat: destination[0],
          lng: destination[1],
        },
        travelMode: transportMode === "walking" ? google.maps.TravelMode.WALKING : google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        }

        if (status === google.maps.DirectionsStatus.OK && result) {
          const leg = result.routes[0].legs[0];
          setDirections(result);
          setRouteDistance(leg.distance?.text || null);
          setRouteDuration(leg.duration?.text || null);
        }
      },
    );
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
      const newProperties = properties.filter((p) => !collectedPropertyIds.current.has(p.id));
      if (newProperties.length > 0) {
        newProperties.forEach((p) => collectedPropertyIds.current.add(p.id));
        setCollectedProperties((prev) => [...prev, ...newProperties]);
        playNotificationSound();
        toast.info(
          `${newProperties.length} propiedad${newProperties.length > 1 ? "es" : ""} detectada${newProperties.length > 1 ? "s" : ""}`,
          {
            duration: 2000,
          },
        );
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
            distance: property.distance_km * 1000, // convert to meters
          });

          if (score >= 70) {
            showPropertyAlert({
              id: property.id,
              title: property.title,
              price: property.price,
              image: property.images?.[0],
              address: property.title,
            });
          }
        });

        playNotificationSound();
        toast.success(
          `${newPropertiesCount} nueva${newPropertiesCount > 1 ? "s" : ""} propiedad${newPropertiesCount > 1 ? "es" : ""} cerca de ti`,
          {
            duration: 3000,
          },
        );
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
      loadPropertiesInViewport(); // ⬅️ Recargar al reanudar
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
    currentParams.set("query", editSearchQuery.trim());
    navigate(`/navegacion?${currentParams.toString()}`, {
      replace: true,
    });
    setIsEditDialogOpen(false);
  };

  // Show loading state while Google Maps API loads
  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={{
          width: "100%",
          height: "100%",
        }}
        center={initialCenter || { lat: 6.2476, lng: -75.5658 }}
        onDragStart={() => {
          setIsUserPanning(true);

          // Pausar centrado por 6s después del último drag
          if (userPanTimeout.current) clearTimeout(userPanTimeout.current);
        }}
        onDragEnd={() => {
          loadPropertiesInViewport(); // ⬅️ Recargar inmediatamente

          // En modo conducción: recenter después de 2 segundos
          if (isDriving && hasStartedNavigation && isUsingCurrentLocation) {
            userPanTimeout.current = setTimeout(() => {
              setIsUserPanning(false);
            }, 2000);
          }
          // En modo pasivo o manual: permitir arrastre libre
          else {
            setIsUserPanning(false);
          }
        }}
        zoom={mapZoom}
        onLoad={(map) => {
          mapRef.current = map;
          trafficLayerRef.current = new google.maps.TrafficLayer();

          // Ajustar ruta en modo navegación directa
          if (isDirectNavigation && directions && userLocation) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(userLocation);
            bounds.extend({ lat: destination[0], lng: destination[1] });
            map.fitBounds(bounds, { top: 100, right: 50, bottom: 250, left: 50 });
          }
        }}
        onZoomChanged={handleZoomChanged}
        // ACTUALIZAR CENTRO DE BÚSQUEDA AL ARRASTRAR
        onIdle={() => {
          // NO actualizar si está en navegación activa
          if (isDriving && hasStartedNavigation && isUsingCurrentLocation) return;

          if (!mapRef.current) return;

          const c = mapRef.current.getCenter();
          if (!c) return;

          // Actualizar centro de búsqueda basado en viewport actual
          setSearchCenter({
            lat: c.lat(),
            lng: c.lng(),
          });
        }}
        options={{
          mapTypeId: mapType === "satellite" ? google.maps.MapTypeId.HYBRID : google.maps.MapTypeId.ROADMAP,
          zoomControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          rotateControl: false,
          gestureHandling: "greedy",
          draggable: true, // Habilitar arrastre explícitamente
          disableDefaultUI: true,
          clickableIcons: false,
          keyboardShortcuts: false,
        }}
      >
        {/* ======================= */}
        {/* USER LOCATION MARKER    */}
        {/* ======================= */}
        {userLocation && (
          <>
            <OverlayView position={userLocation} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
              <div
                style={{
                  position: "relative",
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  {/* Pulse rings - solo en modo pasivo */}
                  {!isDriving && (
                    <>
                      <div
                        style={{
                          position: "absolute",
                          width: "60px",
                          height: "60px",
                          top: "-10px",
                          borderRadius: "50%",
                          background: "rgba(34, 197, 94, 0.3)",
                          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          width: "50px",
                          height: "50px",
                          top: "-5px",
                          borderRadius: "50%",
                          background: "rgba(34, 197, 94, 0.4)",
                          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.5s",
                        }}
                      />
                    </>
                  )}

                  {/* ========================================= */}
                  {/* ICONO DINÁMICO: PASIVO vs ACTIVO         */}
                  {/* ========================================= */}

                  {!isDriving && !hasStartedNavigation ? (
                    // 🟢 ICONO PASIVO: Círculo verde con punto morado
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 48 48"
                      fill="none"
                      style={{
                        filter: "drop-shadow(0 4px 12px rgba(0, 197, 109, 0.4))",
                        position: "relative",
                        zIndex: 10,
                        transition: "all 0.3s ease",
                      }}
                    >
                      {/* Círculo exterior verde */}

                    // 🔵 ICONO ACTIVO: Flecha de navegación
                    <svg
                      width="42"
                      height="42"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{
                        filter: "drop-shadow(0 8px 20px rgba(34, 197, 94, 0.7))",
                        position: "relative",
                        zIndex: 10,
                        transform: `rotate(${heading}deg)`,
                        transition: "transform 0.3s ease-out",
                      }}
                    >
                      {/* Sombra */}
                      <path d="M12 2L4 20L12 16L20 20L12 2Z" fill="rgba(0,0,0,0.2)" transform="translate(0, 1)" />
                      {/* Flecha principal */}
                      <path
                        d="M12 2L4 20L12 16L20 20L12 2Z"
                        fill="url(#arrowGradient)"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      <defs>
                        <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#22c55e" />
                          <stop offset="100%" stopColor="#16a34a" />
                        </linearGradient>
                      </defs>
                    </svg>
                  )}
                </div>

                <style>{`
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.8; }
              }
            `}</style>
              </div>
            </OverlayView>


        {/* ======================= */}
        {/* MANUAL LOCATION MARKER  */}
        {/* ======================= */}
        {hasManualLocation && manualLat && manualLng && (
          <OverlayView
            position={{ lat: Number(manualLat), lng: Number(manualLng) }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              style={{
                position: "relative",
                transform: "translate(-50%, -100%)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                {/* PIN de ubicación manual - estilo moderno */}
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{
                    filter: "drop-shadow(0 4px 12px rgba(255, 91, 4, 0.5))",
                    position: "relative",
                    zIndex: 10,
                  }}
                >
                  {/* Pin principal */}
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                    fill="#FF5B04"
                    stroke="white"
                    strokeWidth="2"
                  />
                  {/* Punto interior blanco */}
                  <circle cx="12" cy="9" r="3" fill="white" />
                </svg>
              </div>
            </div>
          </OverlayView>
        )}

        {/* ======================= */}
        {/* DIRECCIONES */}
        {/* ======================= */}
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

        {/* ======================= */}
        {/* MARCADOR DESTINO */}
        {/* ======================= */}
        {isDirectNavigation && (
          <Marker
            position={{ lat: destination[0], lng: destination[1] }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#ef4444",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
              scale: 12,
            }}
            label={{
              text: searchCriteria || "Destino",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: "bold",
              className: "bg-red-500 px-2 py-1 rounded shadow-lg",
            }}
          />
        )}

        {/* ======================= */}
        {/* PROPIEDADES */}
        {/* ======================= */}
        {!isPaused &&
          !isDirectNavigation &&
          properties?.map((property) => {
            if (!property.latitude || !property.longitude) return null;

            const image = property.images?.[0] ? property.images[0] : "https://placehold.co/100x100?text=Sin+foto";

            const price = formatPrice(property.price);

            return (
              <OverlayView
                key={property.id}
                position={{
                  lat: property.latitude,
                  lng: property.longitude,
                }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div
                  onClick={() => handlePropertyClick(property.id)}
                  style={{
                    transform: "translate(-50%, -100%)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  {/* Precio */}
                  <div
                    style={{
                      background: "white",
                      padding: "2px 6px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#16a34a",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                      marginBottom: "2px",
                    }}
                  >
                    {price}
                  </div>

                  {/* Imagen */}
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "10px",
                      overflow: "hidden",
                      border: "2px solid white",
                      background: "#eee",
                      boxShadow: "0 3px 8px rgba(0,0,0,0.30)",
                    }}
                  >
                    <img
                      src={image}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>

                  {/* Pin */}
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: "6px solid transparent",
                      borderRight: "6px solid transparent",
                      borderTop: "10px solid #16a34a",
                      filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.3))",
                      marginTop: "-4px",
                    }}
                  />
                </div>
              </OverlayView>
            );
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

        {/* Botón de centrar en ubicación manual - Solo visible si hay ubicación manual */}
        {hasManualLocation && manualLat && manualLng && (
          <Button
            onClick={() => {
              if (mapRef.current) {
                const manualLocation = {
                  lat: Number(manualLat),
                  lng: Number(manualLng),
                };
                mapRef.current.panTo(manualLocation);
                mapRef.current.setZoom(17);
                toast.success("Mapa centrado en la ubicación seleccionada");
              }
            }}
            size="icon"
            className="h-12 w-12 bg-white/90 backdrop-blur-sm hover:bg-white shadow-[0_2px_10px_rgba(0,0,0,0.15)] border border-gray-200"
            title="Centrar en ubicación seleccionada"
          >
            <MapPin className="h-5 w-5 text-accent" fill="#FF5B04" />
          </Button>
        )}

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
            <path d="m12 3 8 4-8 4-8-4z" />
            <path d="m4 12 8 4 8-4" />
            <path d="m4 17 8 4 8-4" />
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
                setMapType("roadmap");
                setShowLayersMenu(false);
              }}
              className={`
        flex items-center gap-3 p-2 mb-2 rounded-xl w-full transition
        ${mapType === "roadmap" ? "bg-blue-50 border border-blue-300 shadow-md" : "hover:bg-gray-100"}
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
          ${mapType === "roadmap" ? "text-blue-700" : "text-gray-700"}
        `}
              >
                Estándar
              </span>
            </button>

            {/* SATÉLITE */}
            <button
              onClick={() => {
                setMapType("satellite");
                setShowLayersMenu(false);
              }}
              className={`
        flex items-center gap-3 p-2 rounded-xl w-full transition
        ${mapType === "satellite" ? "bg-blue-50 border border-blue-300 shadow-md" : "hover:bg-gray-100"}
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
          ${mapType === "satellite" ? "text-blue-700" : "text-gray-700"}
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
        <div className="absolute bottom-3 left-0 right-0 z-[1000] flex justify-center px-3">
          <div
            className="
              w-full max-w-md
              rounded-2xl shadow-lg 
              bg-white/90 backdrop-blur-md 
              border border-gray-200
              p-3
              space-y-3
            "
            style={{ minHeight: "auto" }}
          >
            {/* === PRIMERA FILA: botones + info de ruta + detener === */}
            <div className="flex items-center justify-between">
              {/* Transporte */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => setTransportMode("driving")}
                  className={`
                    h-8 w-8 rounded-full flex items-center justify-center text-xs shadow
                    ${transportMode === "driving" ? "bg-blue-600 text-white" : "bg-white text-blue-600 border"}
                  `}
                >
                  <Car className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setTransportMode("walking")}
                  className={`
                    h-8 w-8 rounded-full flex items-center justify-center text-xs shadow
                    ${transportMode === "walking" ? "bg-green-600 text-white" : "bg-white text-green-600 border"}
                  `}
                >
                  <Footprints className="h-4 w-4" />
                </button>
              </div>

              {/* Info ruta compacta - Solo en modo navegación */}
              {isUsingCurrentLocation &&
                routeDistance &&
                routeDuration &&
                hasStartedNavigation &&
                !isDirectNavigation && (
                  <div
                    className="
                    px-2.5 py-1
                    rounded-full
                    bg-white border shadow-sm
                    text-[11px] font-semibold
                    flex items-center gap-2
                  "
                  >
                    <span className="flex items-center gap-1 text-blue-600">{routeDuration}</span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1 text-green-600">{routeDistance}</span>
                  </div>
                )}

              {/* Botón Iniciar Modo Conducción - Solo en modo pasivo */}
              {isUsingCurrentLocation && !hasStartedNavigation && !isDirectNavigation && (
                <button
                  onClick={() => setShowWheelModal(true)}
                  className="px-3 py-1.5 rounded-lg text-[12px] text-white font-semibold shadow bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
                >
                  <Car className="h-3 w-3" />
                  Iniciar conducción
                </button>
              )}

              {/* Botón detener */}
              <button
                onClick={handleToggleNavigation}
                className={`
                  px-3 py-1.5 rounded-lg text-[12px] text-white font-semibold shadow
                  ${isPaused ? "bg-green-600" : "bg-red-500"}
                `}
              >
                {isPaused ? "Reanudar" : "Detener"}
              </button>
            </div>

            {/* === RADIO compactado - Solo en modo navegación === */}
            {isUsingCurrentLocation && hasStartedNavigation && (
              <div className="bg-white/70 border rounded-lg p-2 shadow-sm">
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-gray-600">Radio</span>
                  <span className="font-semibold text-gray-900">
                    {searchRadius >= 1000 ? `${(searchRadius / 1000).toFixed(1)} km` : `${searchRadius} m`}
                  </span>
                </div>

                <Slider
                  value={[searchRadius]}
                  min={100}
                  max={2000}
                  step={50}
                  onValueChange={(v) => handleManualRadiusChange(v[0])}
                />
              </div>
            )}

            {/* === BUSCAR === */}
            <div
              onClick={() => {
                setEditSearchQuery(searchCriteria);
                setIsEditDialogOpen(true);
              }}
              className="
                flex items-center justify-between 
                p-2 rounded-lg bg-white 
                border shadow-sm hover:bg-gray-50 cursor-pointer transition
              "
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search className="h-4 w-4 text-green-600" />
                <p className="text-xs font-medium truncate">{searchCriteria || "Propiedades cerca"}</p>
              </div>
              <Edit2 className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>
      )}

      {/* Dialog para editar búsqueda */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md z-[10000]">
          <DialogHeader>
            <DialogTitle>Modificar búsqueda</DialogTitle>
            <DialogDescription>Edita tu búsqueda actual para encontrar otras propiedades cercanas</DialogDescription>
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
                  if (e.key === "Enter") {
                    handleUpdateSearch();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateSearch}>Actualizar búsqueda</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal "¿Estás al volante?" */}
      <Dialog open={showWheelModal} onOpenChange={setShowWheelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              ¿Estás al volante?
            </DialogTitle>
            <DialogDescription>
              Si estás conduciendo, bloquearemos la pantalla por seguridad. Las propiedades se guardarán
              automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={() => {
                setIsAtWheel(true);
                setShowWheelModal(false);
                handleStartDriving();
                toast.info("Modo conducción con pantalla bloqueada activado");
              }}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              <Car className="h-4 w-4" />
              Sí, estoy conduciendo
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setIsAtWheel(false);
                setShowWheelModal(false);
                handleStartDriving();
                toast.success("Modo copiloto activado - pantalla disponible");
              }}
              className="gap-2"
            >
              No, soy copiloto/pasajero
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Overlay de modo conducción - SOLO si está al volante */}
      {isVehicleMode && isUsingCurrentLocation && isAtWheel && (
        <DrivingModeOverlay speed={currentSpeed} propertiesCount={collectedProperties.length} />
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
    </div>
  );
};
export default NavigationMap;
