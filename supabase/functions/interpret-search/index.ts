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
            content: `Eres un asistente que extrae filtros de búsqueda de propiedades inmobiliarias.

PALABRAS CLAVE VÁLIDAS que indican búsqueda de propiedades:
- Tipos de inmuebles: apartamento, casa, apartaestudio, local, locales, bodega, bodegas, oficina, loft, penthouse, finca, lote
- Características: habitación, habitaciones, alcobas, alcoba, cuarto, cuartos, pieza, piezas, baño, baños, sala, comedor, cocina, patio, balcón, terraza, garaje, parqueadero
- Acciones: arrendar, arriendo, alquilar, alquiler, comprar, compra, venta, vender
- Ubicaciones: barrio, sector, zona, cerca de, en

Si el texto del usuario contiene CUALQUIERA de estas palabras, marca is_valid=true.
Si el texto NO menciona ninguna de estas palabras, marca is_valid=false.

Extrae ubicación, precio, habitaciones y tipo de propiedad cuando se mencionen.`
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
                    description: "true si es búsqueda de inmuebles, false si no"
                  },
                  location: {
                    type: "string",
                    description: "Ubicación mencionada (departamento, municipio, sector, barrio)"
                  },
                  radius: {
                    type: "number",
                    description: "Radio en km (1-20). Default 5."
                  },
                  minPrice: {
                    type: "number",
                    description: "Precio mínimo COP"
                  },
                  maxPrice: {
                    type: "number",
                    description: "Precio máximo COP"
                  },
                  bedrooms: {
                    type: "number",
                    description: "Habitaciones mínimas"
                  },
                  propertyType: {
                    type: "string",
                    enum: ["all", "apartment", "house", "commercial", "warehouse", "studio", "room", "office"],
                    description: "apartment=apartamento, house=casa, studio=apartaestudio, commercial=local, warehouse=bodega, room=habitación, office=oficina, all=todos"
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
