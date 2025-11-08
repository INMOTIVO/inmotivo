import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

  const startRecording = useCallback(async () => {
    // Not used, kept for compatibility
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      reject(new Error('Use recordOnce instead'));
    });
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
          toast.success('Escuchando...', { duration: 600 });

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

        const mr = new MediaRecorder(stream, { mimeType });
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
            toast.error('No se capturó audio');
            setIsProcessing(false);
            stream.getTracks().forEach(t => t.stop());
            return reject(new Error('No audio captured'));
          }

          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          console.log('[Voz Backend] Blob creado:', blob.size, 'bytes, tipo:', blob.type);

          // Validar tamaño mínimo (10KB)
          if (blob.size < 10000) {
            console.error('[Voz Backend] Audio muy corto:', blob.size);
            toast.error('Audio muy corto, intenta de nuevo');
            setIsProcessing(false);
            stream.getTracks().forEach(t => t.stop());
            return reject(new Error('Audio too short'));
          }

          try {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            
            reader.onloadend = async () => {
              const base64 = reader.result?.toString().split(',')[1];
              if (!base64) {
                console.error('[Voz Backend] Error convirtiendo a base64');
                toast.error('Error al procesar audio');
                setIsProcessing(false);
                stream.getTracks().forEach(t => t.stop());
                return reject(new Error('Base64 conversion failed'));
              }

              console.log('[Voz Backend] Base64 generado:', base64.length, 'chars');
              console.log('[Voz Backend] Enviando a transcribe-audio...');

              try {
                const { data, error } = await supabase.functions.invoke('transcribe-audio', {
                  body: { audio: base64 }
                });

                if (error) {
                  console.error('[Voz Backend] Error de función:', error);
                  throw error;
                }

                if (data?.text) {
                  console.log('[Voz Backend] Transcripción exitosa:', data.text);
                  toast.success('Transcrito');
                  resolve(data.text);
                } else {
                  throw new Error('No se recibió transcripción');
                }
              } catch (e: any) {
                console.error('[Voz Backend] Error en transcripción:', e);
                toast.error('Error al transcribir');
                reject(e);
              } finally {
                setIsProcessing(false);
                stream.getTracks().forEach(t => t.stop());
              }
            };

            reader.onerror = () => {
              console.error('[Voz Backend] Error en FileReader');
              toast.error('Error al leer audio');
              setIsProcessing(false);
              stream.getTracks().forEach(t => t.stop());
              reject(new Error('FileReader error'));
            };
          } catch (e) {
            console.error('[Voz Backend] Error general:', e);
            setIsProcessing(false);
            stream.getTracks().forEach(t => t.stop());
            reject(e);
          }
        };

        // Grabar por al menos 3 segundos antes de auto-detener
        mr.start(100); // Capturar chunks cada 100ms
        toast.success('Grabando... (3-5s)', { duration: 600 });
        
        // Auto-detener después de 5 segundos
        setTimeout(() => {
          if (mr.state === 'recording') {
            console.log('[Voz Backend] Auto-deteniendo después de 5s');
            try { mr.stop(); } catch {}
          }
        }, 5000);

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
    recordOnce,
  };
};
