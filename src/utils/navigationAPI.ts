// API helpers for navigation features
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface NearbyParams {
  lat: number;
  lon: number;
  radius: number;
  priceMax?: number;
  type?: string;
  listingType?: string;
}

interface RouteParams {
  route_geojson: any;
  buffer_m?: number;
  priceMax?: number;
  types?: string[];
}

export const fetchNearbyProperties = async (params: NearbyParams) => {
  try {
    const queryParams = new URLSearchParams({
      lat: params.lat.toString(),
      lon: params.lon.toString(),
      radius: params.radius.toString(),
      ...(params.priceMax && { priceMax: params.priceMax.toString() }),
      ...(params.type && { type: params.type }),
      ...(params.listingType && { listingType: params.listingType }),
    });

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/rentals-nearby?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching nearby properties:', error);
    throw error;
  }
};

export const fetchRouteProperties = async (params: RouteParams) => {
  try {
    const { data, error } = await supabase.functions.invoke('rentals-route', {
      body: params,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching route properties:', error);
    throw error;
  }
};

export const encodePolylineToGeoJSON = (polyline: string) => {
  // Decode Google polyline to GeoJSON
  const coordinates: number[][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < polyline.length) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = polyline.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = polyline.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return {
    type: 'LineString',
    coordinates,
  };
};

// Cache for nearby properties to avoid too many requests
interface CacheEntry {
  data: any;
  timestamp: number;
  key: string;
}

const cache: Map<string, CacheEntry> = new Map();
const CACHE_DURATION = 30000; // 30 seconds

export const getCachedNearbyProperties = async (params: NearbyParams & {
  neLat?: number;
  neLng?: number;
  swLat?: number;
  swLng?: number;
}) => {
  // Generar cache key basado en bounds si existen
  let cacheKey: string;
  
  if (params.neLat && params.neLng && params.swLat && params.swLng) {
    // Clave basada en bounds (redondear para agrupar búsquedas similares)
    cacheKey = `bounds_${Math.round(params.neLat * 100)},${Math.round(params.neLng * 100)},${Math.round(params.swLat * 100)},${Math.round(params.swLng * 100)}`;
  } else {
    // Clave basada en centro + radio (modo legacy)
    cacheKey = `${Math.round(params.lat * 100)},${Math.round(params.lon * 100)},${params.radius}`;
  }
  
  const now = Date.now();
  const cached = cache.get(cacheKey);
  
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    console.log('Using cached properties');
    return cached.data;
  }

  const data = await fetchNearbyProperties(params);
  cache.set(cacheKey, { data, timestamp: now, key: cacheKey });
  
  // Limpiar cache antiguo (aumentar a 20 entradas)
  if (cache.size > 20) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    cache.delete(entries[0][0]);
  }
  
  return data;
};