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
            content: `Extrae filtros de búsqueda inmobiliaria. 

VÁLIDO si contiene: apartamento, casa, local, bodega, oficina, habitación, alcoba, baño, sala, patio, balcón, arrendar, comprar, venta, barrio, zona.

Extrae: ubicación, precio, habitaciones, tipo.`
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
                  is_valid: {
                    type: "boolean",
                    description: "true si busca inmuebles"
                  },
                  location: {
                    type: "string",
                    description: "Ubicación"
                  },
                  radius: {
                    type: "number",
                    description: "Radio km (1-20)"
                  },
                  minPrice: {
                    type: "number",
                    description: "Precio mín COP"
                  },
                  maxPrice: {
                    type: "number",
                    description: "Precio máx COP"
                  },
                  bedrooms: {
                    type: "number",
                    description: "Habitaciones mín"
                  },
                  propertyType: {
                    type: "string",
                    enum: ["all", "apartment", "house", "commercial", "warehouse", "studio", "room", "office"],
                    description: "Tipo de propiedad"
                  }
                },
                required: ["is_valid"],
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
