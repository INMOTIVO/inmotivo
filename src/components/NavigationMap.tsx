import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Navigation, Edit2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface NavigationMapProps {
  destination: [number, number];
  filters: any;
  onStopNavigation: () => void;
  searchCriteria?: string;
}

// Propiedades de ejemplo que siempre se muestran
const EXAMPLE_PROPERTIES = [
  {
    id: 'example-1',
    title: 'Apartamento Moderno en El Poblado',
    price: 1800000,
    currency: 'COP',
    latitude: 6.2088,
    longitude: -75.5694,
    neighborhood: 'El Poblado',
    city: 'Medellín',
    bedrooms: 3,
    bathrooms: 2,
    area_m2: 85,
    property_type: 'apartamento',
    status: 'available'
  },
  {
    id: 'example-2',
    title: 'Estudio en Laureles',
    price: 1200000,
    currency: 'COP',
    latitude: 6.2443,
    longitude: -75.5901,
    neighborhood: 'Laureles',
    city: 'Medellín',
    bedrooms: 1,
    bathrooms: 1,
    area_m2: 45,
    property_type: 'apartamento',
    status: 'available'
  },
  {
    id: 'example-3',
    title: 'Apartaestudio en Envigado',
    price: 950000,
    currency: 'COP',
    latitude: 6.1701,
    longitude: -75.5833,
    neighborhood: 'Centro',
    city: 'Envigado',
    bedrooms: 1,
    bathrooms: 1,
    area_m2: 38,
    property_type: 'apartamento',
    status: 'available'
  },
  {
    id: 'example-4',
    title: 'Apartamento en Sabaneta',
    price: 1500000,
    currency: 'COP',
    latitude: 6.1517,
    longitude: -75.6169,
    neighborhood: 'Sabaneta',
    city: 'Sabaneta',
    bedrooms: 2,
    bathrooms: 2,
    area_m2: 65,
    property_type: 'apartamento',
    status: 'available'
  },
  {
    id: 'example-5',
    title: 'Loft en Belén',
    price: 1350000,
    currency: 'COP',
    latitude: 6.2322,
    longitude: -75.6186,
    neighborhood: 'Belén',
    city: 'Medellín',
    bedrooms: 2,
    bathrooms: 1,
    area_m2: 55,
    property_type: 'apartamento',
    status: 'available'
  }
];

const NavigationMap = ({ destination, filters, onStopNavigation, searchCriteria = '' }: NavigationMapProps) => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const routingControl = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const markers = useRef<L.Marker[]>([]);
  const userMarker = useRef<L.Marker | null>(null);
  const radiusCircle = useRef<L.Circle | null>(null);

  // Fetch properties based on filters - limit to 5 for MVP
  const { data: properties } = useQuery({
    queryKey: ['navigation-properties', filters],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .lte('price', 25000000) // Max price 25M
        .limit(5); // Always show max 5 properties

      if (filters.minPrice) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice) query = query.lte('price', Math.min(filters.maxPrice, 25000000));
      if (filters.bedrooms) query = query.gte('bedrooms', filters.bedrooms);
      if (filters.propertyType) query = query.eq('property_type', filters.propertyType);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 30000, // Datos frescos por 30 segundos
    refetchInterval: false, // No refetch automático para evitar parpadeo
    gcTime: 5 * 60 * 1000,
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current, {
      zoomControl: true,
    }).setView([6.2476, -75.5658], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Track user location and draw 2km radius circle - Optimizado para evitar parpadeo
  useEffect(() => {
    if (!map.current) return;

    let lastUpdate = 0;
    const UPDATE_INTERVAL = 5000; // Solo actualizar cada 5 segundos

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastUpdate < UPDATE_INTERVAL) {
          return; // Ignorar actualizaciones muy frecuentes
        }
        lastUpdate = now;

        const newLocation: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserLocation(newLocation);

        if (userMarker.current) {
          userMarker.current.setLatLng(newLocation);
        } else {
          const icon = L.divIcon({
            html: `<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
            className: '',
            iconSize: [20, 20],
          });

          userMarker.current = L.marker(newLocation, { icon }).addTo(map.current!);
        }

        // Update or create 2km radius circle
        if (radiusCircle.current) {
          radiusCircle.current.setLatLng(newLocation);
        } else {
          radiusCircle.current = L.circle(newLocation, {
            radius: 2000, // 2km in meters
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 10',
          }).addTo(map.current!);
        }

        // Solo centrar el mapa si se movió significativamente
        const currentCenter = map.current!.getCenter();
        const distance = currentCenter.distanceTo(L.latLng(newLocation[0], newLocation[1]));
        if (distance > 50) { // Solo si se movió más de 50 metros
          map.current!.panTo(newLocation, { animate: true, duration: 1 });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        // No mostrar toast en cada error para evitar spam
        if (error.code === 1) {
          toast.error('Permiso de ubicación denegado', { id: 'geo-error' });
        }
      },
      {
        enableHighAccuracy: false, // Menos preciso pero más estable
        maximumAge: 5000, // Aceptar ubicaciones de hasta 5 segundos
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (radiusCircle.current && map.current) {
        radiusCircle.current.remove();
      }
    };
  }, []);

  // Setup routing - Optimizado para evitar re-calcular constantemente
  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (routingControl.current) {
      try {
        map.current.removeControl(routingControl.current);
      } catch (e) {
        // Ignorar error si ya fue removido
        console.log('Routing control already removed');
      }
    }

    routingControl.current = (L as any).Routing.control({
      waypoints: [L.latLng(userLocation[0], userLocation[1]), L.latLng(destination[0], destination[1])],
      routeWhileDragging: false,
      showAlternatives: false,
      addWaypoints: false, // Evitar agregar waypoints al hacer click
      lineOptions: {
        styles: [{ color: '#3b82f6', weight: 6, opacity: 0.7 }],
      },
      createMarker: () => null, // Don't create default markers
    }).addTo(map.current!);

    return () => {
      if (routingControl.current && map.current) {
        try {
          map.current.removeControl(routingControl.current);
        } catch (e) {
          // Ignorar error si ya fue removido
          console.log('Cleanup: routing control already removed');
        }
      }
    };
  }, [userLocation, destination]);

  // Update property markers
  useEffect(() => {
    if (!map.current || !userLocation) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Siempre usar las propiedades de ejemplo
    const propertiesToShow = EXAMPLE_PROPERTIES;

    const createPropertyIcon = (price: number) => {
      const priceFormatted = new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
      }).format(price);

      return L.divIcon({
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <!-- Price Label -->
            <div style="
              background: hsl(220 13% 13%);
              color: white;
              padding: 6px 12px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              white-space: nowrap;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            ">
              ${priceFormatted} $
            </div>
            <!-- Pin Marker -->
            <svg width="32" height="40" viewBox="0 0 32 40" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24C32 7.163 24.837 0 16 0z" 
                    fill="hsl(0 84% 60%)" />
              <circle cx="16" cy="16" r="6" fill="white" />
            </svg>
          </div>
        `,
        className: '',
        iconSize: [120, 80],
        iconAnchor: [60, 80],
      });
    };

    // Calculate distance between two points
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Earth's radius in km
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

    // Mostrar siempre las 5 propiedades de ejemplo
    propertiesToShow.forEach((property) => {
      if (!property.latitude || !property.longitude) return;

      const icon = createPropertyIcon(property.price);
      const marker = L.marker([property.latitude, property.longitude], { icon });

      const priceFormatted = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: property.currency,
        minimumFractionDigits: 0,
      }).format(property.price);

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 8px;">${property.title}</h3>
          <p style="color: hsl(142 76% 36%); font-weight: bold; margin-bottom: 8px;">${priceFormatted}</p>
          <p style="margin-bottom: 8px;">${property.neighborhood}, ${property.city}</p>
          <p style="margin-bottom: 8px;">${property.bedrooms} hab • ${property.bathrooms} baños • ${property.area_m2} m²</p>
          <a href="/property/${property.id}" style="color: hsl(142 76% 36%); text-decoration: underline;">Ver detalles</a>
        </div>
      `);

      marker.addTo(map.current!);
      markers.current.push(marker);
    });
  }, [userLocation]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Botón Detener - Más pequeño en móvil */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Button
          onClick={onStopNavigation}
          variant="destructive"
          size="lg"
          className="shadow-lg text-xs md:text-base px-3 py-1.5 md:px-6 md:py-2 h-auto"
        >
          <X className="mr-1 md:mr-2 h-3 w-3 md:h-5 md:w-5" />
          <span className="hidden xs:inline">Detener</span>
          <span className="xs:hidden">Stop</span>
        </Button>
      </div>

      {userLocation && (
        <>
          {/* Navigation Status - Compacto en móvil, posicionado abajo izquierda */}
          <div className="absolute bottom-20 left-4 md:bottom-auto md:top-20 md:left-4 z-[1000] bg-background/95 backdrop-blur p-2 md:p-4 rounded-lg shadow-lg w-[calc(45%-1rem)] md:w-auto md:max-w-sm">
            <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
              <Navigation className="h-3 w-3 md:h-5 md:w-5 text-primary flex-shrink-0" />
              <span className="font-semibold text-[10px] md:text-base leading-tight">Navegando</span>
            </div>
            <p className="text-[8px] md:text-sm text-muted-foreground leading-tight hidden md:block">
              Las propiedades cercanas se actualizan en tiempo real mientras te desplazas
            </p>
            <p className="text-[8px] text-muted-foreground leading-tight md:hidden">
              Actualizando en tiempo real
            </p>
          </div>

          {/* Search Criteria Card - Más compacto en móvil */}
          <Card className="absolute bottom-20 right-4 md:bottom-4 md:right-4 z-[1000] bg-background/90 backdrop-blur-md p-2 md:p-4 w-[calc(50%-1rem)] md:w-auto md:min-w-[280px] md:max-w-sm">
            <div className="space-y-1.5 md:space-y-3">
              <div className="flex items-start justify-between gap-1 md:gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-2">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                    <span className="text-[8px] md:text-xs font-semibold text-muted-foreground uppercase">
                      Buscando
                    </span>
                  </div>
                  <p className="text-[10px] md:text-sm font-medium leading-tight line-clamp-2">
                    {searchCriteria || 'Propiedades cerca'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 md:h-8 md:w-8 p-0 shrink-0"
                  onClick={() => navigate(`/?query=${encodeURIComponent(searchCriteria)}&showOptions=true`)}
                >
                  <Edit2 className="h-2.5 w-2.5 md:h-4 md:w-4" />
                </Button>
              </div>

              <div className="pt-1.5 md:pt-3 border-t space-y-0.5 md:space-y-1.5">
                <div className="flex items-center justify-between text-[9px] md:text-xs">
                  <span className="text-muted-foreground">Radio</span>
                  <span className="font-semibold text-primary">2 km</span>
                </div>
                <div className="flex items-center justify-between text-[9px] md:text-xs">
                  <span className="text-muted-foreground">Cercanas</span>
                  <span className="font-semibold text-primary">5</span>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default NavigationMap;
