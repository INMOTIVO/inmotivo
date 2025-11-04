import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { route_geojson, buffer_m = 150, priceMax = 0, types = [] } = await req.json();

    if (!route_geojson || !route_geojson.geometry) {
      return new Response(
        JSON.stringify({ error: "route_geojson with geometry is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get properties
    let query = supabase
      .from("properties")
      .select("*")
      .eq("status", "available");

    if (types.length > 0 && !types.includes("all")) {
      query = query.in("property_type", types);
    }

    if (priceMax > 0) {
      query = query.lte("price", priceMax);
    }

    const { data: properties, error } = await query;

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    // Extract route coordinates
    const routeCoords = extractRouteCoordinates(route_geojson.geometry);
    
    // Filter properties within buffer distance of route
    const bufferKm = buffer_m / 1000;
    const propertiesInRoute = (properties || [])
      .map((property) => {
        const propLat = property.latitude;
        const propLon = property.longitude;
        
        if (!propLat || !propLon) return null;
        
        // Find minimum distance to route
        let minDistance = Infinity;
        for (const coord of routeCoords) {
          const distance = calculateDistance(propLat, propLon, coord.lat, coord.lng);
          if (distance < minDistance) {
            minDistance = distance;
          }
        }
        
        if (minDistance <= bufferKm) {
          return {
            ...property,
            distance_to_route_km: minDistance,
          };
        }
        return null;
      })
      .filter((p) => p !== null)
      .sort((a, b) => a!.distance_to_route_km - b!.distance_to_route_km)
      .slice(0, 30); // Limit to 30 properties along route

    // Convert to GeoJSON
    const geojson = {
      type: "FeatureCollection",
      features: propertiesInRoute.map((property) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [property!.longitude, property!.latitude],
        },
        properties: {
          id: property!.id,
          title: property!.title,
          price: property!.price,
          bedrooms: property!.bedrooms,
          bathrooms: property!.bathrooms,
          area: property!.area,
          property_type: property!.property_type,
          images: property!.images,
          distance_to_route_km: property!.distance_to_route_km,
        },
      })),
    };

    return new Response(JSON.stringify(geojson), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractRouteCoordinates(geometry: any): Array<{ lat: number; lng: number }> {
  const coords: Array<{ lat: number; lng: number }> = [];
  
  if (geometry.type === "LineString") {
    for (const coord of geometry.coordinates) {
      coords.push({ lng: coord[0], lat: coord[1] });
    }
  } else if (geometry.type === "MultiLineString") {
    for (const line of geometry.coordinates) {
      for (const coord of line) {
        coords.push({ lng: coord[0], lat: coord[1] });
      }
    }
  }
  
  return coords;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}