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
  const [audioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const resolveRef = useRef<((value: string) => void) | null>(null);
  const rejectRef = useRef<((reason?: any) => void) | null>(null);

  const startRecording = useCallback(async () => {
    try {
      console.log('[Voz Manual] Iniciando grabación...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;
      
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }

      const mr = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64000 });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log('[Voz Manual] Chunk recibido:', e.data.size, 'bytes');
          audioChunksRef.current.push(e.data);
        }
      };

      mr.onstop = async () => {
        console.log('[Voz Manual] Grabación detenida, procesando...');
        setIsRecording(false);

        if (audioChunksRef.current.length === 0) {
          console.error('[Voz Manual] Sin chunks de audio');
          setIsProcessing(false);
          stream.getTracks().forEach(t => t.stop());
          if (rejectRef.current) rejectRef.current(new Error('No audio captured'));
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('[Voz Manual] Blob creado:', blob.size, 'bytes, tipo:', blob.type);

        // Validar tamaño mínimo reducido para móvil (500 bytes)
        if (blob.size < 500) {
          console.error('[Voz Manual] Audio muy corto:', blob.size);
          setIsProcessing(false);
          stream.getTracks().forEach(t => t.stop());
          if (rejectRef.current) rejectRef.current(new Error('Audio demasiado corto'));
          toast.error('Audio muy corto, habla más');
          return;
        }

          try {
            setIsProcessing(true);
            console.log('[Voz Manual] Enviando blob directo (FormData) a transcribe-audio...');
            const formData = new FormData();
            formData.append('file', blob, 'audio.webm');
            const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
              body: formData,
            });
            if (!resp.ok) {
              const t = await resp.text();
              throw new Error(`Func error ${resp.status}: ${t}`);
            }
            const data = await resp.json();
            if (data?.text) {
              console.log('[Voz Manual] Transcripción exitosa:', data.text);
              if (resolveRef.current) resolveRef.current(data.text);
            } else {
              throw new Error('No se recibió transcripción');
            }
          } catch (e: any) {
            console.error('[Voz Manual] Error en transcripción:', e);
            if (rejectRef.current) rejectRef.current(e);
          } finally {
            setIsProcessing(false);
            stream.getTracks().forEach(t => t.stop());
          }
      };

      mr.start(500);
      setIsRecording(true);

    } catch (e: any) {
      console.error('[Voz Manual] Error al iniciar:', e);
      toast.error('No se pudo acceder al micrófono');
      setIsRecording(false);
      setIsProcessing(false);
    }
  }, []);

  const stopRecording = useCallback((): Promise<string> => {
    setIsProcessing(true);
    return new Promise((resolve, reject) => {
      resolveRef.current = resolve;
      rejectRef.current = reject;

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        console.log('[Voz Manual] Deteniendo grabación...');
        try {
          mediaRecorderRef.current.stop();
          
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
        } catch (e) {
          console.error('[Voz Manual] Error al detener:', e);
          setIsProcessing(false);
          reject(e);
        }
      } else {
        console.warn('[Voz Manual] No hay grabación activa');
        setIsProcessing(false);
        reject(new Error('No hay grabación activa'));
      }
    });
  }, []);

  const cancelRecording = useCallback(() => {
    console.log('[Voz Manual] Cancelando grabación...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error('[Voz Manual] Error al cancelar:', e);
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }

    audioChunksRef.current = [];
    setIsRecording(false);
    setIsProcessing(false);
    
    if (rejectRef.current) {
      rejectRef.current(new Error('Cancelled by user'));
    }
    
    resolveRef.current = null;
    rejectRef.current = null;
  }, []);

  const recordOnce = useCallback(async (): Promise<string> => {
    const SR: any = (window.SpeechRecognition || window.webkitSpeechRecognition);
    
    // Intentar Web Speech API primero
    if (SR) {
      try {
        const result = await new Promise<string>((resolve, reject) => {
          const recognition = new SR();
          recognition.lang = 'es-CO';
          recognition.interimResults = false;
          recognition.continuous = false;
          try { recognition.maxAlternatives = 1; } catch {}
          
          let finalText = '';
          let hasResult = false;
          
          setIsRecording(true);
          setIsProcessing(false);

          recognition.onresult = (event: any) => {
            for (let i = 0; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                finalText = event.results[i][0].transcript.trim();
                hasResult = true;
                console.log('[Voz SR] Resultado:', finalText);
              }
            }
          };

          recognition.onerror = (e: any) => {
            console.warn('[Voz SR] Error:', e.error);
            setIsRecording(false);
            reject(new Error('SR_ERROR'));
          };

          recognition.onend = () => {
            setIsRecording(false);
            if (hasResult && finalText.length > 0) {
              resolve(finalText);
            } else {
              reject(new Error('NO_RESULT'));
            }
          };

          recognition.start();

          // Timeout de seguridad
          setTimeout(() => {
            try { recognition.stop(); } catch {}
          }, 8000);
        });

        setIsProcessing(false);
        return result;
      } catch (srError: any) {
        console.log('[Voz] SR falló, usando backend...', srError.message);
      }
    }

    // Fallback: MediaRecorder + backend
    setIsProcessing(true);
    setIsRecording(true);

    return new Promise<string>(async (resolve, reject) => {
      try {
        console.log('[Voz Backend] Iniciando grabación...');
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
          }
        });
        
        streamRef.current = stream;
        
        // Usar audio/webm si está disponible
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm';
        }

        const mr = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64000 });
        mediaRecorderRef.current = mr;
        audioChunksRef.current = [];

        mr.ondataavailable = (e) => {
          if (e.data.size > 0) {
            console.log('[Voz Backend] Chunk recibido:', e.data.size, 'bytes');
            audioChunksRef.current.push(e.data);
          }
        };

        mr.onstop = async () => {
          console.log('[Voz Backend] Grabación detenida, procesando...');
          setIsRecording(false);

          if (audioChunksRef.current.length === 0) {
            console.error('[Voz Backend] Sin chunks de audio');
            setIsProcessing(false);
            stream.getTracks().forEach(t => t.stop());
            return reject(new Error('No audio captured'));
          }

          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          console.log('[Voz Backend] Blob creado:', blob.size, 'bytes, tipo:', blob.type);

          // Validar tamaño mínimo reducido a 1KB
          if (blob.size < 1000) {
            console.error('[Voz Backend] Audio muy corto:', blob.size);
            setIsProcessing(false);
            stream.getTracks().forEach(t => t.stop());
            return reject(new Error('Audio too short'));
          }

          try {
            console.log('[Voz Backend] Enviando blob directo (FormData) a transcribe-audio...');
            const formData = new FormData();
            formData.append('file', blob, 'audio.webm');
            const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
              body: formData,
            });
            if (!resp.ok) {
              const t = await resp.text();
              throw new Error(`Func error ${resp.status}: ${t}`);
            }
            const data = await resp.json();
            if (data?.text) {
              console.log('[Voz Backend] Transcripción exitosa:', data.text);
              resolve(data.text);
            } else {
              throw new Error('No se recibió transcripción');
            }
          } catch (e) {
            console.error('[Voz Backend] Error en transcripción:', e);
            reject(e);
          } finally {
            setIsProcessing(false);
            stream.getTracks().forEach(t => t.stop());
          }
        };

        // Grabar por al menos 3 segundos antes de auto-detener
        mr.start(500); // Capturar chunks cada 500ms
        
        // Auto-detener después de 30 segundos (seguridad)
        setTimeout(() => {
          if (mr.state === 'recording') {
            console.log('[Voz Backend] Auto-deteniendo después de 30s');
            try { mr.stop(); } catch {}
          }
        }, 30000);

      } catch (e: any) {
        console.error('[Voz Backend] Error al iniciar:', e);
        toast.error('No se pudo acceder al micrófono');
        setIsRecording(false);
        setIsProcessing(false);
        reject(e);
      }
    });
  }, []);

  return {
    isRecording,
    isProcessing,
    audioLevel,
    startRecording,
    stopRecording,
    cancelRecording,
    recordOnce,
  };
};
