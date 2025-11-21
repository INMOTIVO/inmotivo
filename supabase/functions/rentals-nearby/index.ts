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
    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get("lat") || "");
    const lon = parseFloat(url.searchParams.get("lon") || "");
    const radius = parseInt(url.searchParams.get("radius") || "300");
    const priceMax = parseFloat(url.searchParams.get("priceMax") || "0");
    const type = url.searchParams.get("type") || "all";
    const listingType = url.searchParams.get("listingType") || "rent";
    
    // Nuevos parámetros para búsqueda por bounds
    const neLat = parseFloat(url.searchParams.get("neLat") || "");
    const neLng = parseFloat(url.searchParams.get("neLng") || "");
    const swLat = parseFloat(url.searchParams.get("swLat") || "");
    const swLng = parseFloat(url.searchParams.get("swLng") || "");
    
    const hasBounds = !isNaN(neLat) && !isNaN(neLng) && !isNaN(swLat) && !isNaN(swLng);

    // Validación: necesitamos bounds O centro+radio
    if (!hasBounds && (isNaN(lat) || isNaN(lon))) {
      return new Response(
        JSON.stringify({ error: "Either bounds (neLat, neLng, swLat, swLng) or center (lat, lon) is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Build query
    let query = supabase
      .from("properties")
      .select("*")
      .eq("status", "available")
      .eq("listing_type", listingType);

    // Filter by type
    if (type !== "all") {
      query = query.eq("property_type", type);
    }

    // Filter by price
    if (priceMax > 0) {
      query = query.lte("price", priceMax);
    }

    const { data: properties, error } = await query;

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    let filteredProperties;
    
    if (hasBounds) {
      // Filtrar por bounding box
      filteredProperties = (properties || [])
        .map((property) => {
          const propLat = property.latitude || lat + (Math.random() - 0.5) * 0.01;
          const propLon = property.longitude || lon + (Math.random() - 0.5) * 0.01;
          
          // Calcular distancia al centro para ordenar
          const distance = calculateDistance(lat, lon, propLat, propLon);
          
          return {
            ...property,
            latitude: propLat,
            longitude: propLon,
            distance_km: distance,
          };
        })
        .filter((p) => 
          p.latitude >= swLat && 
          p.latitude <= neLat &&
          p.longitude >= swLng && 
          p.longitude <= neLng
        )
        .sort((a, b) => a.distance_km - b.distance_km)
        .slice(0, 200); // Aumentar límite a 200 propiedades
    } else {
      // Filtrar por radio circular (modo legacy)
      const radiusKm = radius / 1000;
      filteredProperties = (properties || [])
        .map((property) => {
          const propLat = property.latitude || lat + (Math.random() - 0.5) * 0.01;
          const propLon = property.longitude || lon + (Math.random() - 0.5) * 0.01;
          
          const distance = calculateDistance(lat, lon, propLat, propLon);
          
          return {
            ...property,
            latitude: propLat,
            longitude: propLon,
            distance_km: distance,
          };
        })
        .filter((p) => p.distance_km <= radiusKm)
        .sort((a, b) => a.distance_km - b.distance_km)
        .slice(0, 200);
    }

    // Convert to GeoJSON
    const geojson = {
      type: "FeatureCollection",
      features: filteredProperties.map((property) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [property.longitude, property.latitude],
        },
        properties: {
          id: property.id,
          title: property.title,
          price: property.price,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area: property.area,
          property_type: property.property_type,
          images: property.images,
          distance_km: property.distance_km,
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