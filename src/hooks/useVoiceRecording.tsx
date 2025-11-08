import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Tipos mínimos para Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel] = useState(0); // sin visualización avanzada

  // Refs para modos
  const recognitionRef = useRef<any>(null);
  const resultResolverRef = useRef<((text: string) => void) | null>(null);
  const resultRejectRef = useRef<((err: any) => void) | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const srTimeoutRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const SR: any = (window.SpeechRecognition || window.webkitSpeechRecognition);
      if (SR) {
        const recognition = new SR();
        recognition.lang = 'es-CO';
        recognition.interimResults = false;
        recognition.continuous = false;
        try { recognition.maxAlternatives = 1; } catch {}
        recognitionRef.current = recognition;

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            if (res.isFinal) {
              const finalTranscript = (res[0]?.transcript || '').trim();
              const confidence = res[0]?.confidence;
              console.log('[Voz] Final SR', { lang: recognition.lang, confidence, text: finalTranscript });
              resultResolverRef.current?.(finalTranscript);
              resultResolverRef.current = null;
              resultRejectRef.current = null;
              if (srTimeoutRef.current) { clearTimeout(srTimeoutRef.current); srTimeoutRef.current = null; }
            }
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('[Voz] SR error, fallback a servidor', e);
          if (srTimeoutRef.current) { clearTimeout(srTimeoutRef.current); srTimeoutRef.current = null; }
          resultRejectRef.current?.(e);
          resultResolverRef.current = null;
          resultRejectRef.current = null;
        };

        recognition.onend = () => {
          setIsRecording(false);
          if (srTimeoutRef.current) { clearTimeout(srTimeoutRef.current); srTimeoutRef.current = null; }
          // Si no llegó resultado final, rechazar para liberar estados
          if (resultResolverRef.current) {
            resultRejectRef.current?.(new Error('Sin resultado final'));
            resultResolverRef.current = null;
            resultRejectRef.current = null;
          }
        };

        recognition.start();
        setIsRecording(true);
        toast.success('Escuchando... (es-CO)', { duration: 1200 });
        return;
      }

      // Fallback: MediaRecorder + función de backend
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.start();
      setIsRecording(true);
      toast.success('Grabando... Habla ahora', { duration: 1200 });
    } catch (error) {
      console.error('Error accediendo al micrófono:', error);
      toast.error('No se pudo acceder al micrófono');
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      setIsProcessing(true);

      // Si estamos en modo SR
      if (recognitionRef.current) {
        resultResolverRef.current = (t: string) => { setIsProcessing(false); resolve(t); };
        resultRejectRef.current = (err) => { setIsProcessing(false); reject(err); };
        try { recognitionRef.current.stop(); } catch (e) { console.error(e); }
        return;
      }

      // Fallback: detener MediaRecorder y enviar a backend
      if (mediaRecorderRef.current && isRecording) {
        const mr = mediaRecorderRef.current;
        mr.onstop = async () => {
          setIsRecording(false);
          try {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
              const base64 = reader.result?.toString().split(',')[1];
              if (!base64) {
                toast.error('Error al procesar el audio');
                setIsProcessing(false);
                reject(new Error('Error processing audio'));
                return;
              }
              try {
                console.log('[Voz] Backend es-CO');
                const { data, error } = await supabase.functions.invoke('transcribe-audio', { body: { audio: base64 } });
                if (error) throw error;
                if (data?.text) {
                  toast.success('Audio transcrito');
                  resolve(data.text as string);
                } else {
                  throw new Error('No se recibió transcripción');
                }
              } catch (e) {
                console.error('Error transcribiendo:', e);
                toast.error('Error al transcribir el audio');
                reject(e);
              } finally {
                setIsProcessing(false);
                if (mr.stream) mr.stream.getTracks().forEach(t => t.stop());
              }
            };
          } catch (e) {
            setIsProcessing(false);
            reject(e);
          }
        };
        try { mr.stop(); } catch {}
      } else {
        setIsProcessing(false);
        reject(new Error('No recording in progress'));
      }
    });
  }, [isRecording]);

  return {
    isRecording,
    isProcessing,
    audioLevel,
    startRecording,
    stopRecording,
  };
};
