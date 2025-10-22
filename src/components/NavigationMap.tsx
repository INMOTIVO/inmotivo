import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
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
  const directionArrow = useRef<L.Marker | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editSearchQuery, setEditSearchQuery] = useState(searchCriteria);
  const [searchRadius, setSearchRadius] = useState<number>(300); // Default 300 meters

  // Fetch real properties from database and position them around user location
  // More radius = more properties
  const getPropertyLimit = (radius: number) => {
    if (radius <= 500) return 5;
    if (radius <= 1000) return 10;
    if (radius <= 1500) return 15;
    return 20;
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
        // Convert meters to degrees (approximate: 1 degree ≈ 111km)
        const maxDistanceDegrees = (searchRadius / 111000);
        const minDistanceDegrees = (searchRadius * 0.3 / 111000); // Min 30% of radius
        const distance = minDistanceDegrees + Math.random() * (maxDistanceDegrees - minDistanceDegrees);
        const lat = userLocation[0] + distance * Math.cos(angle);
        const lng = userLocation[1] + distance * Math.sin(angle);

        return {
          ...property,
          latitude: lat,
          longitude: lng,
        };
      });
    },
    enabled: !!userLocation,
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

  // Track user location and draw radius circle + heading arrow
  useEffect(() => {
    if (!map.current) return;

    let lastUpdate = 0;
    const UPDATE_INTERVAL = 5000;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastUpdate < UPDATE_INTERVAL) {
          return;
        }
        lastUpdate = now;

        const newLocation: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserLocation(newLocation);
        
        // Update heading if available
        if (position.coords.heading !== null) {
          setHeading(position.coords.heading);
        }

        if (userMarker.current) {
          userMarker.current.setLatLng(newLocation);
        } else {
          const icon = L.divIcon({
            html: `
              <div style="
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                animation: bounce 1s ease-in-out infinite;
              ">
                <!-- Persona caminando -->
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 12px rgba(139, 92, 246, 0.5));">
                  <!-- Cabeza -->
                  <circle cx="12" cy="5" r="2.5" fill="#8b5cf6" stroke="white" stroke-width="1.5"/>
                  <!-- Cuerpo -->
                  <path d="M12 7.5 L12 14" stroke="#8b5cf6" stroke-width="2.5" stroke-linecap="round"/>
                  <!-- Brazo izquierdo -->
                  <path d="M12 9 L9 11" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round">
                    <animate attributeName="d" 
                      values="M12 9 L9 11;M12 9 L9 13;M12 9 L9 11" 
                      dur="1s" 
                      repeatCount="indefinite"/>
                  </path>
                  <!-- Brazo derecho -->
                  <path d="M12 9 L15 13" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round">
                    <animate attributeName="d" 
                      values="M12 9 L15 13;M12 9 L15 11;M12 9 L15 13" 
                      dur="1s" 
                      repeatCount="indefinite"/>
                  </path>
                  <!-- Pierna izquierda -->
                  <path d="M12 14 L10 19" stroke="#8b5cf6" stroke-width="2.5" stroke-linecap="round">
                    <animate attributeName="d" 
                      values="M12 14 L10 19;M12 14 L11 20;M12 14 L10 19" 
                      dur="1s" 
                      repeatCount="indefinite"/>
                  </path>
                  <!-- Pierna derecha -->
                  <path d="M12 14 L14 20" stroke="#8b5cf6" stroke-width="2.5" stroke-linecap="round">
                    <animate attributeName="d" 
                      values="M12 14 L14 20;M12 14 L13 19;M12 14 L14 20" 
                      dur="1s" 
                      repeatCount="indefinite"/>
                  </path>
                </svg>
                <!-- Círculo de ubicación debajo -->
                <div style="
                  width: 16px;
                  height: 16px;
                  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 0 20px rgba(139, 92, 246, 0.6);
                  animation: pulse 2s ease-in-out infinite;
                "></div>
              </div>
              <style>
                @keyframes bounce {
                  0%, 100% { transform: translateY(0px); }
                  50% { transform: translateY(-4px); }
                }
                @keyframes pulse {
                  0%, 100% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.2); opacity: 0.8; }
                }
              </style>
            `,
            className: '',
            iconSize: [40, 60],
            iconAnchor: [20, 60],
          });

          userMarker.current = L.marker(newLocation, { icon }).addTo(map.current!);
        }
        
        // Update or create direction arrow
        if (position.coords.heading !== null && position.coords.heading >= 0) {
          const arrowIcon = L.divIcon({
            html: `
              <div style="transform: rotate(${position.coords.heading}deg); transform-origin: center;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(16, 185, 129, 0.4));">
                  <path d="M12 4 L18 12 L12 10 L6 12 Z" fill="#10b981" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
                  <path d="M12 10 L12 20" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </div>
            `,
            className: '',
            iconSize: [48, 48],
            iconAnchor: [24, 48],
          });
          
          // Calculate position 30 meters in front of user
          const arrowLat = newLocation[0] + (0.00027 * Math.cos(position.coords.heading * Math.PI / 180));
          const arrowLng = newLocation[1] + (0.00027 * Math.sin(position.coords.heading * Math.PI / 180));
          
          if (directionArrow.current) {
            directionArrow.current.setLatLng([arrowLat, arrowLng]);
            directionArrow.current.setIcon(arrowIcon);
          } else {
            directionArrow.current = L.marker([arrowLat, arrowLng], { icon: arrowIcon }).addTo(map.current!);
          }
        }

        // Create radius circle if it doesn't exist
        if (!radiusCircle.current) {
          radiusCircle.current = L.circle(newLocation, {
            radius: searchRadius,
            color: '#8b5cf6',
            fillColor: '#a78bfa',
            fillOpacity: 0.15,
            weight: 3,
            dashArray: '8, 12',
          }).addTo(map.current!);
        } else {
          radiusCircle.current.setLatLng(newLocation);
        }

        const currentCenter = map.current!.getCenter();
        const distance = currentCenter.distanceTo(L.latLng(newLocation[0], newLocation[1]));
        if (distance > 50) {
          map.current!.panTo(newLocation, { animate: true, duration: 1 });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === 1) {
          toast.error('Permiso de ubicación denegado', { id: 'geo-error' });
        }
      },
      {
        enableHighAccuracy: true, // Enable for heading
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (radiusCircle.current && map.current) {
        radiusCircle.current.remove();
        radiusCircle.current = null;
      }
      if (directionArrow.current && map.current) {
        directionArrow.current.remove();
      }
    };
  }, []);

  // Update radius circle and map zoom when searchRadius changes
  useEffect(() => {
    if (radiusCircle.current && userLocation) {
      radiusCircle.current.setRadius(searchRadius);
    }
    
    // Adjust map zoom to fit the search radius
    if (map.current && userLocation) {
      // Calculate appropriate zoom level based on radius
      // Zoom levels: higher number = more zoomed in
      let zoom;
      if (searchRadius <= 300) zoom = 16;
      else if (searchRadius <= 500) zoom = 15.5;
      else if (searchRadius <= 800) zoom = 15;
      else if (searchRadius <= 1200) zoom = 14.5;
      else if (searchRadius <= 1600) zoom = 14;
      else zoom = 13.5;
      
      map.current.setView(userLocation, zoom, { animate: true, duration: 0.5 });
    }
  }, [searchRadius, userLocation]);

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
        styles: [{ color: '#8b5cf6', weight: 7, opacity: 0.8 }],
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

  // Setup navigation handler for property details
  useEffect(() => {
    (window as any).navigateToProperty = (propertyId: string) => {
      navigate(`/property/${propertyId}`);
    };
    
    return () => {
      delete (window as any).navigateToProperty;
    };
  }, [navigate]);

  // Update property markers with real data
  useEffect(() => {
    if (!map.current || !userLocation || !properties) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    const createPropertyIcon = (price: number) => {
      const priceFormatted = new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
      }).format(price);

      return L.divIcon({
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <!-- Price Label -->
            <div style="
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              padding: 6px 12px;
              border-radius: 10px;
              font-size: 14px;
              font-weight: 700;
              white-space: nowrap;
              box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
            ">
              ${priceFormatted} $
            </div>
            <!-- Pin Marker -->
            <svg width="32" height="40" viewBox="0 0 32 40" style="filter: drop-shadow(0 6px 10px rgba(16, 185, 129, 0.4));">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24C32 7.163 24.837 0 16 0z" 
                    fill="#10b981" />
              <circle cx="16" cy="16" r="6" fill="white" />
            </svg>
          </div>
        `,
        className: '',
        iconSize: [120, 80],
        iconAnchor: [60, 80],
      });
    };

    // Show real properties from database
    properties.forEach((property) => {
      if (!property.latitude || !property.longitude) return;

      const icon = createPropertyIcon(property.price);
      const marker = L.marker([property.latitude, property.longitude], { icon });

      const priceFormatted = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: property.currency || 'COP',
        minimumFractionDigits: 0,
      }).format(property.price);

      const imageUrl = property.images && property.images[0] 
        ? (typeof property.images[0] === 'string' ? property.images[0] : property.images[0])
        : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80';

      marker.bindPopup(`
        <div style="min-width: 280px; max-width: 320px;">
          <img src="${imageUrl}" alt="${property.title}" 
               style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;" 
               onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80'"/>
          <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">${property.title}</h3>
          <p style="color: #10b981; font-weight: bold; margin-bottom: 8px; font-size: 18px;">${priceFormatted}</p>
          <p style="margin-bottom: 8px; color: #666; font-size: 14px;">${property.neighborhood || 'N/A'}, ${property.city}</p>
          <p style="margin-bottom: 12px; color: #666; font-size: 13px;">
            ${property.bedrooms} hab • ${property.bathrooms} baños • ${property.area_m2} m²
          </p>
          <button 
             onclick="window.navigateToProperty('${property.id}')"
             style="
               width: 100%;
               display: block;
               background: linear-gradient(135deg, #10b981, #059669);
               color: white;
               text-decoration: none;
               padding: 12px 20px;
               border-radius: 8px;
               text-align: center;
               font-weight: 600;
               font-size: 14px;
               border: 2px solid #10b981;
               box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
               transition: all 0.2s;
               cursor: pointer;
             "
             onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 16px rgba(16, 185, 129, 0.4)';"
             onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.3)';"
          >
            Ver Detalles
          </button>
        </div>
      `, {
        maxWidth: 320,
        className: 'custom-popup'
      });

      marker.addTo(map.current!);
      markers.current.push(marker);
    });
  }, [userLocation, properties]);

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
          {/* Navigation Status - Ancho reducido 50% */}
          <div className="absolute bottom-20 left-4 md:bottom-auto md:top-20 md:left-4 z-[1000] bg-background/95 backdrop-blur p-2 md:p-4 rounded-lg shadow-lg w-[calc(22.5%-0.5rem)] md:w-[140px]">
            <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
              <Navigation className="h-3 w-3 md:h-5 md:w-5 text-primary flex-shrink-0" />
              <span className="font-semibold text-[10px] md:text-base leading-tight">Navegando</span>
            </div>
            <p className="text-[8px] md:text-sm text-muted-foreground leading-tight hidden md:block">
              Actualizando en tiempo real
            </p>
            <p className="text-[8px] text-muted-foreground leading-tight md:hidden">
              Actualizando
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
                  onClick={() => {
                    setEditSearchQuery(searchCriteria);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit2 className="h-2.5 w-2.5 md:h-4 md:w-4" />
                </Button>
              </div>

              <div className="pt-1.5 md:pt-3 border-t space-y-2 md:space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[9px] md:text-xs">
                    <span className="text-muted-foreground">Radio de búsqueda</span>
                    <span className="font-semibold text-primary">
                      {searchRadius >= 1000 ? `${(searchRadius / 1000).toFixed(1)} km` : `${searchRadius} m`}
                    </span>
                  </div>
                  <Slider
                    value={[searchRadius]}
                    onValueChange={(value) => setSearchRadius(value[0])}
                    min={200}
                    max={2000}
                    step={50}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[8px] md:text-[10px] text-muted-foreground">
                    <span>200m</span>
                    <span>2km</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[9px] md:text-xs pt-1 border-t">
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
