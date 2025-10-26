import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();

    if (!audio) {
      throw new Error("No se proporcionó audio");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY no configurada");
    }

    // Usar Lovable AI Gateway para transcribir el audio vía chat multimodal
    const gatewayUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";

    const payload = {
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Eres un transcriptor de voz a texto en español. Devuelve únicamente la transcripción limpia, sin prefijos ni explicaciones.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Transcribe este audio a texto en español." },
            { type: "input_audio", input_audio: { data: audio, format: "webm" } },
          ],
        },
      ],
    } as const;

    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "rate_limit",
            message:
              "Has alcanzado el límite de solicitudes. Por favor espera un momento e intenta nuevamente.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "payment_required",
            message: "Se requiere agregar créditos a tu cuenta de Lovable AI.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      console.error("AI Gateway transcription error:", response.status, errorText);
      throw new Error(`Error en transcripción: ${errorText}`);
    }

    const ai = await response.json();

    // Extraer texto de la respuesta (puede venir como string o como partes)
    let text = "";
    const msg = ai.choices?.[0]?.message;
    if (typeof msg?.content === "string") {
      text = msg.content;
    } else if (Array.isArray(msg?.content)) {
      text = msg.content
        .map((part: any) => {
          if (typeof part === "string") return part;
          if (part?.type === "text") return part.text ?? "";
          return "";
        })
        .join("")
        .trim();
    }

    if (!text) {
      throw new Error("No se obtuvo transcripción");
    }

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
