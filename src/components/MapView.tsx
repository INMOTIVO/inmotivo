import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  radius: number;
  filters: {
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    propertyType?: string;
  };
}

interface Property {
  id: string;
  title: string;
  price: number;
  latitude: number;
  longitude: number;
  bedrooms: number;
  bathrooms: number;
  area_m2: number;
  property_type: string;
  neighborhood: string;
  city: string;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
}

const MapView = ({ radius, filters }: MapViewProps) => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<[number, number]>([6.2476, -75.5658]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newLocation);
          setMapKey(prev => prev + 1);
          setLocationError(null);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('No se pudo obtener tu ubicación. Mostrando Medellín.');
        }
      );
    }
  }, []);

  const { data: properties, isLoading } = useQuery({
    queryKey: ['map-properties', radius, filters, userLocation],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.bedrooms) {
        query = query.gte('bedrooms', filters.bedrooms);
      }
      if (filters.propertyType && filters.propertyType !== 'all') {
        query = query.eq('property_type', filters.propertyType);
      }

      const { data, error } = await query;
      if (error) throw error;

      const filtered = (data as Property[]).filter((property) => {
        const distance = calculateDistance(
          userLocation[0],
          userLocation[1],
          property.latitude,
          property.longitude
        );
        return distance <= radius;
      });

      return filtered;
    },
  });

  const propertyTypes: Record<string, string> = {
    apartment: 'Apartamento',
    house: 'Casa',
    commercial: 'Local',
    warehouse: 'Bodega',
    studio: 'Apartaestudio',
  };

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border bg-background">
      {locationError && (
        <div className="bg-yellow-500/10 text-yellow-600 px-4 py-2 text-sm">
          {locationError}
        </div>
      )}
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Cargando mapa...</p>
        </div>
      ) : (
        <MapContainer
          key={mapKey}
          center={userLocation}
          zoom={13}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <Marker position={userLocation}>
            <Popup>Tu ubicación</Popup>
          </Marker>

          {properties?.map((property) => (
            <Marker
              key={property.id}
              position={[property.latitude, property.longitude]}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-semibold mb-1">{property.title}</h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    {property.neighborhood}, {property.city}
                  </p>
                  <p className="text-sm mb-1">
                    {propertyTypes[property.property_type] || property.property_type}
                  </p>
                  <p className="font-bold text-primary mb-2">
                    ${property.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {property.bedrooms} hab • {property.bathrooms} baños • {property.area_m2} m²
                  </p>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/property/${property.id}`)}
                    className="w-full"
                  >
                    Ver detalles
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
};

export default MapView;
