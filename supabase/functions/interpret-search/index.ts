import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Combinar validación y extracción en una sola llamada para velocidad
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite", // Modelo más rápido
        messages: [
          {
            role: "system",
            content: `Eres un experto en búsqueda inmobiliaria con análisis semántico avanzado. Analiza el texto y extrae la INTENCIÓN SEMÁNTICA del usuario.

TIPOS VÁLIDOS: apartamento, casa, local, bodega, oficina, habitacion, estudio

ANÁLISIS SEMÁNTICO AVANZADO:
- Si dice "apartamento" → tipo: "apartamento", relatedTypes: ["apartaestudio", "loft", "duplex"]
- Si dice "casa" → tipo: "casa", relatedTypes: ["townhouse", "casa-lote"]
- Si dice "local comercial" → tipo: "local", relatedTypes: ["oficina", "local"]
- Si menciona "2 habitaciones" o "2 alcobas" → habitaciones: 2, flexibleBedrooms: true (acepta 1-3)
- Si dice "amplio", "grande", "espacioso" → areaPriority: true
- Si dice "económico", "barato", "accesible" → priceIntent: "low"
- Si dice "lujoso", "exclusivo", "premium" → priceIntent: "high"
- Si dice "cerca de X" sin ubicación específica → nearbyAmbiguity: true
- Si menciona "patio", "balcón", "parqueadero", "garaje", "terraza" → mustInclude: ["patio"]

UBICACIÓN:
- Extraer ciudad, barrio, sector (Medellín, Envigado, Sabaneta, Laureles, Poblado, etc.)
- Si dice "Sabaneta" o "Envigado" → nearbyAmbiguity: true (incluir municipios vecinos)

PRECIO EN PESOS COLOMBIANOS:
- Económico (low): hasta 1,500,000
- Promedio (medium): 1,500,000 - 3,000,000
- Alto (high): más de 3,000,000

EJEMPLOS:
"apartamento de 2 habitaciones en sabaneta" →
  tipo: "apartamento", habitaciones: 2, flexibleBedrooms: true, relatedTypes: ["apartaestudio", "loft"], location: "sabaneta"

"casa amplia familiar cerca del parque envigado" →
  tipo: "casa", areaPriority: true, nearbyAmbiguity: true, relatedTypes: ["townhouse", "casa-lote"], location: "envigado", mustInclude: ["parque"]

"propiedad económica con patio" →
  tipo: null, priceIntent: "low", mustInclude: ["patio"]

"local comercial laureles" →
  tipo: "local", relatedTypes: ["oficina"], location: "laureles"

IMPORTANTE: Solo marca is_valid: true si es búsqueda inmobiliaria. Si preguntan por restaurantes, productos, etc., marca is_valid: false.`
          },
          {
            role: "user",
            content: query
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_semantic_intent",
              description: "Extrae intención semántica avanzada de búsqueda inmobiliaria",
              parameters: {
                type: "object",
                properties: {
                  is_valid: {
                    type: "boolean",
                    description: "true si la consulta es sobre búsqueda de propiedades inmobiliarias"
                  },
                  tipo: {
                    type: "string",
                    enum: ["apartamento", "casa", "local", "bodega", "oficina", "habitacion", "estudio", null],
                    description: "Tipo principal de propiedad"
                  },
                  habitaciones: {
                    type: "number",
                    description: "Número de habitaciones mencionadas"
                  },
                  relatedTypes: {
                    type: "array",
                    items: { type: "string" },
                    description: "Tipos similares o relacionados (ej: apartamento → apartaestudio, loft)"
                  },
                  flexibleBedrooms: {
                    type: "boolean",
                    description: "true si acepta ±1 habitación del número mencionado"
                  },
                  areaPriority: {
                    type: "boolean",
                    description: "true si menciona 'amplio', 'grande', 'espacioso'"
                  },
                  priceIntent: {
                    type: "string",
                    enum: ["low", "medium", "high", null],
                    description: "Intención de precio: económico=low, promedio=medium, lujoso=high"
                  },
                  nearbyAmbiguity: {
                    type: "boolean",
                    description: "true si dice 'cerca de' sin ubicación exacta"
                  },
                  mustInclude: {
                    type: "array",
                    items: { type: "string" },
                    description: "Palabras clave obligatorias: patio, balcón, parqueadero, etc"
                  },
                  location: {
                    type: "string",
                    description: "Ubicación mencionada (ciudad, barrio, zona)"
                  },
                  minPrice: {
                    type: "number",
                    description: "Precio mínimo en pesos colombianos"
                  },
                  maxPrice: {
                    type: "number",
                    description: "Precio máximo en pesos colombianos"
                  },
                  radius: {
                    type: "number",
                    description: "Radio de búsqueda en kilómetros (por defecto 5)"
                  }
                },
                required: ["is_valid"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_semantic_intent" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Intenta más tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Fondos insuficientes. Por favor añade créditos." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Error en AI gateway");
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error("No tool call found in response:", JSON.stringify(data));
      throw new Error("No se pudieron extraer filtros");
    }

    console.log("Tool call arguments:", toolCall.function.arguments);
    
    // El arguments puede venir como string o como objeto
    let result;
    try {
      if (typeof toolCall.function.arguments === 'string') {
        // Limpiar JSONs duplicados - el modelo a veces devuelve múltiples objetos
        let cleanedArgs = toolCall.function.arguments.trim();
        
        // Si contiene múltiples objetos JSON, extraer solo el primero
        const firstBraceIndex = cleanedArgs.indexOf('{');
        if (firstBraceIndex !== -1) {
          let braceCount = 0;
          let endIndex = firstBraceIndex;
          
          for (let i = firstBraceIndex; i < cleanedArgs.length; i++) {
            if (cleanedArgs[i] === '{') braceCount++;
            if (cleanedArgs[i] === '}') braceCount--;
            
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
          
          cleanedArgs = cleanedArgs.substring(firstBraceIndex, endIndex);
          console.log("Cleaned arguments:", cleanedArgs);
        }
        
        result = JSON.parse(cleanedArgs);
      } else {
        result = toolCall.function.arguments;
      }
    } catch (parseError) {
      console.error("Error parsing arguments:", parseError);
      console.error("Raw arguments:", toolCall.function.arguments);
      throw new Error("Error al procesar la respuesta de IA");
    }
    
    // Validar si es búsqueda válida
    if (result.is_valid === false) {
      return new Response(
        JSON.stringify({ 
          error: "invalid_query",
          message: "Lo siento, soy un buscador especializado en propiedades inmobiliarias.",
          suggestion: "Ejemplo: Apartamento de 2 habitaciones cerca del metro, máximo 2.5 millones"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Remover is_valid antes de enviar filtros
    const { is_valid, ...filters } = result;

    // Geocodificar location si existe
    if (filters.location) {
      try {
        const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
        if (!GOOGLE_MAPS_API_KEY) {
          console.warn("GOOGLE_MAPS_API_KEY no configurado, no se puede geocodificar");
        } else {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(filters.location + ', Colombia')}&key=${GOOGLE_MAPS_API_KEY}`;
          
          const geoResponse = await fetch(geocodeUrl);
          const geoData = await geoResponse.json();
          
          if (geoData.status === 'OK' && geoData.results?.[0]) {
            const location = geoData.results[0].geometry.location;
            filters.searchLat = location.lat;
            filters.searchLng = location.lng;
            filters.radius = filters.radius || 12; // Default 12 km
            console.log(`Geocoded "${filters.location}" → lat: ${location.lat}, lng: ${location.lng}`);
          } else {
            console.warn(`No se pudo geocodificar: ${filters.location}`, geoData.status);
          }
        }
      } catch (geoError) {
        console.error("Error geocodificando:", geoError);
        // No bloquear la búsqueda si falla geocodificación
      }
    }

    return new Response(
      JSON.stringify({ filters }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
