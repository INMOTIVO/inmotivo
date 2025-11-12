import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [partialText, setPartialText] = useState(""); // 🔹 texto en vivo

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const resolveRef = useRef<((value: string) => void) | null>(null);
  const rejectRef = useRef<((reason?: any) => void) | null>(null);

  // 🎚️ Monitoreo de nivel de audio (sin cambios)
  const startAudioLevelMonitoring = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const mic = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 256;
      mic.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(Math.min(1, (avg / 128) * 2));
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      updateLevel();
    } catch (e) {
      console.error("[AudioLevel] Error:", e);
    }
  }, []);

  const stopAudioLevelMonitoring = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    setAudioLevel(0);
  }, []);

  // 🎤 INICIO DE GRABACIÓN CON TRANSCRIPCIÓN EN VIVO
  const startRecording = useCallback(async () => {
    try {
      // Intentar usar SpeechRecognition primero (para texto en vivo)
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const recognition = new SR();
        recognition.lang = "es-CO";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognitionRef.current = recognition;
        setPartialText("");
        setIsRecording(true);
        setIsProcessing(false);

        recognition.onresult = (event: any) => {
          let text = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            text += result[0].transcript;
          }
          setPartialText(text); // 🔹 actualiza mientras hablas
        };

        recognition.onerror = (e: any) => {
          console.warn("[SR Error]", e.error);
          toast.error("Error con reconocimiento de voz");
        };

        recognition.onend = () => {
          console.log("[SR] Finalizado");
          setIsRecording(false);
        };

        recognition.start();
        console.log("[SR] Iniciado con texto en vivo");
        return;
      }

      // 🧩 Si no hay SpeechRecognition, usa flujo actual (backend Supabase)
      console.log("[Voz] SR no disponible, usando MediaRecorder...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startAudioLevelMonitoring(stream);
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];

      mr.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
      mr.start(500);
      setIsRecording(true);
    } catch (e) {
      console.error("[Voz] Error al iniciar grabación:", e);
      toast.error("No se pudo acceder al micrófono");
      setIsRecording(false);
    }
  }, [startAudioLevelMonitoring]);

  // 🛑 DETENER GRABACIÓN
  const stopRecording = useCallback((): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      resolveRef.current = resolve;
      rejectRef.current = reject;
      setIsProcessing(true);

      // Si había SpeechRecognition en curso
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          setIsRecording(false);
          setIsProcessing(false);
          resolve(partialText.trim());
          recognitionRef.current = null;
          return;
        } catch (err) {
          console.warn("[SR Stop error]", err);
        }
      }

      // Si estaba usando backend
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        stopAudioLevelMonitoring();
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append("file", blob, "audio.webm");

        try {
          const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`, {
            method: "POST",
            headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: formData,
          });
          const data = await resp.json();
          resolve(data?.text || "");
        } catch (err) {
          console.error("[Voz Backend] Error:", err);
          reject(err);
        } finally {
          setIsProcessing(false);
          setIsRecording(false);
          streamRef.current?.getTracks().forEach((t) => t.stop());
        }
      } else {
        reject(new Error("No hay grabación activa"));
      }
    });
  }, [partialText, stopAudioLevelMonitoring]);

  const cancelRecording = useCallback(() => {
    console.log("[Voz] Cancelando grabación...");
    stopAudioLevelMonitoring();
    recognitionRef.current?.stop?.();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setPartialText("");
    setIsRecording(false);
    setIsProcessing(false);
  }, [stopAudioLevelMonitoring]);

  return {
    isRecording,
    isProcessing,
    audioLevel,
    partialText, // 🔹 texto que se actualiza en tiempo real
    startRecording,
    stopRecording,
    cancelRecording,
  };
};
