import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Procesar base64 en chunks para evitar problemas de memoria con audios largos
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();

    if (!audio) {
      throw new Error("No se proporcionó audio");
    }

    console.info(`Received audio, base64 length: ${audio.length}`);

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY no configurada");
    }

    // Convertir base64 a binary de forma eficiente
    const bytes = processBase64Chunks(audio);
    console.info(`Processed audio bytes: ${bytes.length}`);

    // Crear FormData con el audio
    const formData = new FormData();
    const blob = new Blob([bytes], { type: "audio/webm" });
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-1");
    // Pedimos formato detallado para obtener idioma detectado
    formData.append("response_format", "verbose_json");
    
    // CRITICAL: Forzar español (sesgo es-CO por prompt)
    formData.append("language", "es");
    
    // Temperature 0 = más determinista, menos variación
    formData.append("temperature", "0");
    
    // Prompt optimizado para español colombiano y contexto inmobiliario, sin normalizaciones
    formData.append("prompt", 
      "Transcribe literalmente en español colombiano (es-CO) sin normalizar ni corregir. " +
      "No conviertas palabras a números, no cambies nombres propios ni topónimos. " +
      "Contexto inmobiliario en Colombia: apartamento, casa, habitaciones, baños, parqueadero, estrato, " +
      "arriendo, venta, millones de pesos, cerca del metro, Medellín, Envigado, Sabaneta, Itagüí, Laureles, Poblado, Belén."
    );

    console.info("Sending request to OpenAI Whisper API...");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error (${response.status}):`, errorText);
      throw new Error(`Error en transcripción: ${errorText}`);
    }

    const result = await response.json();
    console.info(`Transcription result: ${result.text}`);
    if (result.language) console.info(`Detected language: ${result.language}`);
    
    // Check if language detection worked correctly
    if (result.language && result.language !== "es" && result.language !== "spanish") {
      console.warn(`⚠️ WARNING: Detected language is "${result.language}", expected "es" (Spanish). This may indicate poor audio quality or wrong language detection.`);
    }

    return new Response(
      JSON.stringify({ text: result.text, language: result.language ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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
