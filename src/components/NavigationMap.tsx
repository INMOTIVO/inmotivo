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
        .limit(5); // Always show max 5 properties

      if (filters.minPrice) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
      if (filters.bedrooms) query = query.gte('bedrooms', filters.bedrooms);
      if (filters.propertyType) query = query.eq('property_type', filters.propertyType);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds
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

  // Track user location and draw 2km radius circle
  useEffect(() => {
    if (!map.current) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
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

        map.current!.setView(newLocation, map.current!.getZoom());
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Error obteniendo ubicación');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (radiusCircle.current && map.current) {
        radiusCircle.current.remove();
      }
    };
  }, []);

  // Setup routing
  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (routingControl.current) {
      map.current.removeControl(routingControl.current);
    }

    routingControl.current = (L as any).Routing.control({
      waypoints: [L.latLng(userLocation[0], userLocation[1]), L.latLng(destination[0], destination[1])],
      routeWhileDragging: false,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: '#3b82f6', weight: 6, opacity: 0.7 }],
      },
      createMarker: () => null, // Don't create default markers
    }).addTo(map.current!);

    return () => {
      if (routingControl.current && map.current) {
        map.current.removeControl(routingControl.current);
      }
    };
  }, [userLocation, destination]);

  // Update property markers
  useEffect(() => {
    if (!map.current || !properties || !userLocation) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    const createPropertyIcon = (type: string) => {
      const colors: Record<string, string> = {
        apartment: '#10b981',
        house: '#f59e0b',
        commercial: '#8b5cf6',
        warehouse: '#ef4444',
        studio: '#06b6d4',
      };
      const color = colors[type] || '#6b7280';

      return L.divIcon({
        html: `<div style="
          background: ${color}; 
          width: 24px; 
          height: 24px; 
          border-radius: 4px; 
          border: 2px solid white; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.3); 
          display: flex; 
          align-items: center; 
          justify-content: center;
          position: relative;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
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

    // Only show properties within 2km of user
    const nearbyProperties = properties.filter((property) => {
      if (!property.latitude || !property.longitude) return false;
      const distance = calculateDistance(
        userLocation[0],
        userLocation[1],
        property.latitude,
        property.longitude
      );
      return distance <= 2;
    });

    nearbyProperties.forEach((property) => {
      if (!property.latitude || !property.longitude) return;

      const icon = createPropertyIcon(property.property_type);
      const marker = L.marker([property.latitude, property.longitude], { icon });

      const priceFormatted = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: property.currency,
        minimumFractionDigits: 0,
      }).format(property.price);

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 8px;">${property.title}</h3>
          <p style="color: #059669; font-weight: bold; margin-bottom: 8px;">${priceFormatted}</p>
          <p style="margin-bottom: 8px;">${property.neighborhood}, ${property.city}</p>
          <p style="margin-bottom: 8px;">${property.bedrooms} hab • ${property.bathrooms} baños • ${property.area_m2} m²</p>
          <a href="/property/${property.id}" style="color: #3b82f6; text-decoration: underline;">Ver detalles</a>
        </div>
      `);

      marker.addTo(map.current!);
      markers.current.push(marker);
    });
  }, [properties, userLocation]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        <Button
          onClick={onStopNavigation}
          variant="destructive"
          size="lg"
          className="shadow-lg"
        >
          <X className="mr-2 h-5 w-5" />
          Detener navegación
        </Button>
      </div>

      {userLocation && (
        <>
          <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-background/95 backdrop-blur p-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="h-5 w-5 text-primary" />
              <span className="font-semibold">Navegando hacia tu destino</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Las propiedades cercanas se actualizan en tiempo real mientras te desplazas
            </p>
          </div>

          {/* Search Criteria Card - Bottom Right */}
          <Card className="absolute bottom-4 right-4 z-[1000] bg-background/90 backdrop-blur-md p-4 max-w-xs">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Buscando
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-tight">
                    {searchCriteria || 'Propiedades cerca de ti'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={() => navigate(`/?query=${encodeURIComponent(searchCriteria)}&showOptions=true`)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="pt-3 border-t space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Radio de búsqueda</span>
                  <span className="font-semibold text-primary">2 km</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Propiedades cercanas</span>
                  <span className="font-semibold text-primary">{properties?.length || 0}</span>
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
