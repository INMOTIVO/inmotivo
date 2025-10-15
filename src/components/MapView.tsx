import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Arreglar iconos por defecto de Leaflet cuando se usa con bundlers
// @ts-ignore - _getIconUrl es privado en tipos
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewProps {
  radius: number; // en km
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

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const MapView: React.FC<MapViewProps> = ({ radius, filters }) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>([6.2476, -75.5658]); // Medellín
  const [locationError, setLocationError] = useState<string | null>(null);

  // Obtener ubicación del usuario
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocationError(null);
      },
      (err) => {
        console.warn('Geolocation error', err);
        setLocationError('No se pudo obtener tu ubicación. Mostrando Medellín.');
      }
    );
  }, []);

  // Inicializar el mapa una sola vez
  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        center: userLocation,
        zoom: 13,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);

      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }
  }, [userLocation]);

  // Recentrar cuando cambie la ubicación
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(userLocation, 13);
    }
  }, [userLocation]);

  const { data: properties, isLoading } = useQuery({
    queryKey: ['map-properties-basic', radius, filters, userLocation.toString()],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (filters.minPrice) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
      if (filters.bedrooms) query = query.gte('bedrooms', filters.bedrooms);
      if (filters.propertyType && filters.propertyType !== 'all')
        query = query.eq('property_type', filters.propertyType);

      const { data, error } = await query;
      if (error) throw error;

      return (data as Property[]).filter((p) =>
        haversineKm(userLocation[0], userLocation[1], p.latitude, p.longitude) <= radius
      );
    },
  });

  // Pintar marcadores cuando cambien datos
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    // Círculo de radio
    L.circle(userLocation, { radius: radius * 1000, color: '#22c55e', weight: 1 }).addTo(layer);

    // Marcador de usuario
    L.marker(userLocation).addTo(layer).bindPopup('Tu ubicación');

    // Marcadores de propiedades
    properties?.forEach((p) => {
      const marker = L.marker([p.latitude, p.longitude]).addTo(layer);
      const popupHtml = `
        <div style="min-width:220px">
          <h3 style="margin:0 0 4px 0;font-weight:600;">${p.title}</h3>
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">${p.neighborhood}, ${p.city}</div>
          <div style="font-size:12px;margin-bottom:4px;">${p.bedrooms} hab • ${p.bathrooms} baños • ${p.area_m2} m²</div>
          <div style="font-weight:700;color:#16a34a;margin-bottom:8px;">$${Number(p.price).toLocaleString()}</div>
          <button data-prop-id="${p.id}" style="width:100%;padding:8px 10px;background:#22c55e;color:white;border:none;border-radius:6px;cursor:pointer;">Ver detalles</button>
        </div>`;
      marker.bindPopup(popupHtml);
      marker.on('popupopen', () => {
        const btn = document.querySelector(`button[data-prop-id="${p.id}"]`);
        btn?.addEventListener('click', () => navigate(`/property/${p.id}`), { once: true });
      });
    });
  }, [properties, radius, userLocation, navigate]);

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border bg-background">
      {locationError && (
        <div className="bg-yellow-500/10 text-yellow-600 px-4 py-2 text-sm">{locationError}</div>
      )}
      {isLoading && (
        <div className="flex items-center justify-center h-12 text-muted-foreground">Cargando mapa…</div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default MapView;
