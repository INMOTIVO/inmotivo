import { useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, MapPin, Home, Bed, Bath, Maximize } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SavedPropertiesReviewProps {
  properties: any[];
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
}

export const SavedPropertiesReview = ({ 
  properties, 
  userLocation, 
  onClose 
}: SavedPropertiesReviewProps) => {
  const navigate = useNavigate();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const handlePropertyClick = (property: any) => {
    setSelectedProperty(property);
    if (mapRef.current) {
      mapRef.current.panTo({ 
        lat: property.latitude, 
        lng: property.longitude 
      });
      mapRef.current.setZoom(17);
    }
  };

  const handleViewProperty = (propertyId: string) => {
    navigate(`/properties/${propertyId}`);
  };

  if (!isLoaded || !userLocation) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h2 className="text-2xl font-bold">Propiedades Encontradas</h2>
            <p className="text-sm text-muted-foreground">
              {properties.length} propiedades en tu recorrido de 2km
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mapa */}
      <div className="absolute inset-0 pt-24">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={userLocation}
          zoom={15}
          onLoad={map => { mapRef.current = map; }}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
        >
          {/* Círculo de 2km */}
          <Circle
            center={userLocation}
            radius={2000}
            options={{
              fillColor: '#22c55e',
              fillOpacity: 0.1,
              strokeColor: '#22c55e',
              strokeOpacity: 0.4,
              strokeWeight: 2
            }}
          />

          {/* Marcador de usuario */}
          <Marker
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#22c55e',
              fillOpacity: 1,
              strokeColor: 'white',
              strokeWeight: 3
            }}
          />

          {/* Marcadores de propiedades */}
          {properties.map((property) => (
            <Marker
              key={property.id}
              position={{ lat: property.latitude, lng: property.longitude }}
              onClick={() => handlePropertyClick(property)}
              icon={{
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: selectedProperty?.id === property.id ? '#8b5cf6' : '#3b82f6',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 2,
                rotation: 180
              }}
            />
          ))}
        </GoogleMap>
      </div>

      {/* Lista de propiedades */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-background border-t max-h-[40vh] overflow-y-auto">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {properties.map((property) => (
            <Card 
              key={property.id} 
              className={`cursor-pointer transition-all ${
                selectedProperty?.id === property.id 
                  ? 'border-primary shadow-lg' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => handlePropertyClick(property)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-1">
                    {property.title}
                  </CardTitle>
                  <Badge variant="secondary" className="ml-2">
                    {property.property_type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {property.neighborhood || property.city}
                </p>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center gap-4 text-sm mb-3">
                  {property.bedrooms > 0 && (
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4 text-muted-foreground" />
                      <span>{property.bedrooms}</span>
                    </div>
                  )}
                  {property.bathrooms > 0 && (
                    <div className="flex items-center gap-1">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                      <span>{property.bathrooms}</span>
                    </div>
                  )}
                  {property.area_m2 && (
                    <div className="flex items-center gap-1">
                      <Maximize className="h-4 w-4 text-muted-foreground" />
                      <span>{property.area_m2}m²</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    ${property.price.toLocaleString()}
                  </span>
                  <Button 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewProperty(property.id);
                    }}
                  >
                    Ver detalles
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
