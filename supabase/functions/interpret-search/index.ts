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

    // Primero validar si la consulta es sobre inmuebles
    const validationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Eres un validador de consultas para un buscador de inmuebles. Determina si la consulta del usuario está relacionada con búsqueda de propiedades inmobiliarias (apartamentos, casas, apartaestudios, habitaciones, bodegas, oficinas, locales, estudios, lofts, fincas, etc.) o si está preguntando algo completamente diferente."
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
              name: "validate_query",
              description: "Valida si la consulta es sobre búsqueda de inmuebles",
              parameters: {
                type: "object",
                properties: {
                  is_valid: {
                    type: "boolean",
                    description: "true si la consulta es sobre búsqueda de propiedades inmobiliarias, false si es sobre otro tema"
                  },
                  reason: {
                    type: "string",
                    description: "Breve explicación de por qué es válida o no válida"
                  }
                },
                required: ["is_valid", "reason"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "validate_query" } }
      }),
    });

    if (!validationResponse.ok) {
      throw new Error("Error en validación AI");
    }

    const validationData = await validationResponse.json();
    const validationCall = validationData.choices[0]?.message?.tool_calls?.[0];
    
    if (!validationCall) {
      throw new Error("No se pudo validar la consulta");
    }

    const validation = JSON.parse(validationCall.function.arguments);
    
    // Si la consulta no es válida, retornar error específico
    if (!validation.is_valid) {
      return new Response(
        JSON.stringify({ 
          error: "invalid_query",
          message: "Lo siento, soy un buscador especializado en propiedades inmobiliarias. Por favor describe qué tipo de inmueble buscas (apartamento, casa, oficina, local, etc.) y sus características.",
          suggestion: "Ejemplo: Apartamento de 2 habitaciones en Medellín cerca del metro, máximo 2.5 millones"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Eres un asistente que interpreta búsquedas de propiedades inmobiliarias en lenguaje natural y extrae filtros estructurados."
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
              name: "extract_filters",
              description: "Extrae los filtros de búsqueda de propiedades del texto del usuario",
              parameters: {
                type: "object",
                properties: {
                  radius: {
                    type: "number",
                    description: "Radio de búsqueda en kilómetros (1-20). Por defecto 5."
                  },
                  minPrice: {
                    type: "number",
                    description: "Precio mínimo en COP"
                  },
                  maxPrice: {
                    type: "number",
                    description: "Precio máximo en COP"
                  },
                  bedrooms: {
                    type: "number",
                    description: "Número mínimo de habitaciones"
                  },
                  propertyType: {
                    type: "string",
                    enum: ["all", "apartment", "house", "commercial", "warehouse", "studio"],
                    description: "Tipo de propiedad"
                  }
                },
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_filters" } }
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
      throw new Error("No se pudieron extraer filtros");
    }

    const filters = JSON.parse(toolCall.function.arguments);

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
