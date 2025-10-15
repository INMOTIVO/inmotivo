import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Crear iconos personalizados para diferentes tipos de propiedades
const createPropertyIcon = (type: string, color: string) => {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="11" fill="${color}" stroke="white" stroke-width="2"/>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="white" stroke="white" stroke-width="1.5"/>
      <polyline points="9 22 9 12 15 12 15 22" fill="${color}" stroke="white" stroke-width="1"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-property-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const createUserIcon = () => {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="10" r="3" fill="white"/>
      <path d="M6.5 18.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" stroke="white" stroke-width="2" fill="none"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-user-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const getPropertyColor = (type: string): string => {
  const colors: Record<string, string> = {
    apartment: '#ef4444',
    house: '#f97316',
    commercial: '#eab308',
    warehouse: '#a855f7',
    studio: '#ec4899',
  };
  return colors[type] || '#ef4444';
};

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

    // Círculo de radio con mejor estilo
    L.circle(userLocation, { 
      radius: radius * 1000, 
      color: '#3b82f6', 
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      weight: 2,
      dashArray: '5, 10'
    }).addTo(layer);

    // Marcador de usuario con icono personalizado
    L.marker(userLocation, { icon: createUserIcon() })
      .addTo(layer)
      .bindPopup('<div style="text-align:center;font-weight:600;color:#3b82f6;">📍 Tu ubicación</div>');

    // Marcadores de propiedades con iconos personalizados
    properties?.forEach((p) => {
      const propertyColor = getPropertyColor(p.property_type);
      const marker = L.marker([p.latitude, p.longitude], {
        icon: createPropertyIcon(p.property_type, propertyColor)
      }).addTo(layer);
      
      // Sanitize property data to prevent XSS
      const sanitize = (str: string | number) => {
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
      };
      
      const typeLabels: Record<string, string> = {
        apartment: 'Apartamento',
        house: 'Casa',
        commercial: 'Local',
        warehouse: 'Bodega',
        studio: 'Apartaestudio',
      };
      
      const popupHtml = `
        <div style="min-width:240px;font-family:system-ui,-apple-system,sans-serif;">
          <div style="background:${propertyColor};color:white;padding:8px 12px;margin:-10px -10px 10px;border-radius:8px 8px 0 0;">
            <div style="font-size:11px;opacity:0.9;margin-bottom:2px;">${typeLabels[p.property_type] || p.property_type}</div>
            <h3 style="margin:0;font-weight:600;font-size:15px;">${sanitize(p.title)}</h3>
          </div>
          <div style="padding:0 4px;">
            <div style="font-size:12px;color:#6b7280;margin-bottom:8px;display:flex;align-items:center;">
              <span style="margin-right:4px;">📍</span>
              ${sanitize(p.neighborhood)}, ${sanitize(p.city)}
            </div>
            <div style="display:flex;gap:12px;font-size:12px;margin-bottom:10px;color:#374151;">
              <span>🛏️ ${sanitize(p.bedrooms)}</span>
              <span>🚿 ${sanitize(p.bathrooms)}</span>
              <span>📐 ${sanitize(p.area_m2)}m²</span>
            </div>
            <div style="font-weight:700;color:${propertyColor};font-size:18px;margin-bottom:12px;">
              $${Number(p.price).toLocaleString()} COP
            </div>
            <button data-prop-id="${sanitize(p.id)}" style="width:100%;padding:10px;background:${propertyColor};color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;transition:opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
              Ver detalles →
            </button>
          </div>
        </div>`;
      marker.bindPopup(popupHtml);
      marker.on('popupopen', () => {
        const btn = document.querySelector(`button[data-prop-id="${sanitize(p.id)}"]`);
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
