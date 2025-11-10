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
        }
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      // Detectar el mejor formato de audio disponible
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Usar el formato por defecto del navegador
          }
        }
      }
      console.log('[Voz Manual] Formato de audio:', mimeType || 'default');

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          console.log('[Voz Manual] Chunk recibido:', e.data.size, 'bytes');
          audioChunksRef.current.push(e.data);
        }
      };

      mr.onerror = (e) => {
        console.error('[Voz Manual] Error en MediaRecorder:', e);
      };

      mr.onstop = async () => {
        console.log('[Voz Manual] Grabación detenida, procesando...');
        console.log('[Voz Manual] Total de chunks:', audioChunksRef.current.length);
        setIsRecording(false);

        if (audioChunksRef.current.length === 0) {
          console.error('[Voz Manual] Sin chunks de audio capturados');
          setIsProcessing(false);
          stream.getTracks().forEach(t => t.stop());
          toast.error('No se capturó audio. Intenta hablar más fuerte.');
          if (rejectRef.current) rejectRef.current(new Error('No audio captured'));
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        console.log('[Voz Manual] Blob creado:', blob.size, 'bytes, tipo:', blob.type);

        // Validar tamaño mínimo de 500 bytes (muy permisivo)
        if (blob.size < 500) {
          console.error('[Voz Manual] Audio muy corto:', blob.size, 'bytes');
          setIsProcessing(false);
          stream.getTracks().forEach(t => t.stop());
          toast.error('Audio muy corto. Habla por al menos 1 segundo.');
          if (rejectRef.current) rejectRef.current(new Error('Audio too short'));
          return;
        }

        try {
          setIsProcessing(true);
          
          // Timeout de 10 segundos para la transcripción
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Transcription timeout')), 10000);
          });

          const reader = new FileReader();
          reader.readAsDataURL(blob);
          
          reader.onloadend = async () => {
            const base64 = reader.result?.toString().split(',')[1];
            if (!base64) {
              console.error('[Voz Manual] Error convirtiendo a base64');
              setIsProcessing(false);
              stream.getTracks().forEach(t => t.stop());
              if (rejectRef.current) rejectRef.current(new Error('Base64 conversion failed'));
              return;
            }

            console.log('[Voz Manual] Base64 generado:', base64.length, 'chars');
            console.log('[Voz Manual] Enviando a transcribe-audio...');

            try {
              const transcriptionPromise = supabase.functions.invoke('transcribe-audio', {
                body: { audio: base64 }
              });

              const { data, error } = await Promise.race([transcriptionPromise, timeoutPromise]) as any;

              if (error) {
                console.error('[Voz Manual] Error de función:', error);
                throw error;
              }

              if (data?.text) {
                console.log('[Voz Manual] Transcripción exitosa:', data.text);
                if (resolveRef.current) resolveRef.current(data.text);
              } else {
                throw new Error('No se recibió transcripción');
              }
            } catch (e: any) {
              console.error('[Voz Manual] Error en transcripción:', e);
              if (e.message === 'Transcription timeout') {
                toast.error('La transcripción tardó demasiado. Intenta de nuevo.');
              }
              if (rejectRef.current) rejectRef.current(e);
            } finally {
              setIsProcessing(false);
              stream.getTracks().forEach(t => t.stop());
            }
          };

          reader.onerror = () => {
            console.error('[Voz Manual] Error en FileReader');
            setIsProcessing(false);
            stream.getTracks().forEach(t => t.stop());
            if (rejectRef.current) rejectRef.current(new Error('FileReader error'));
          };
        } catch (e) {
          console.error('[Voz Manual] Error general:', e);
          setIsProcessing(false);
          stream.getTracks().forEach(t => t.stop());
          if (rejectRef.current) rejectRef.current(e);
        }
      };

      // Iniciar grabación con timeslice de 500ms (buen balance móvil/web)
      // Esto solicita chunks cada 500ms para asegurar captura continua
      mr.start(500);
      setIsRecording(true);
      console.log('[Voz Manual] MediaRecorder iniciado, esperando chunks...');

    } catch (e: any) {
      console.error('[Voz Manual] Error al iniciar:', e);
      toast.error('No se pudo acceder al micrófono');
      setIsRecording(false);
      setIsProcessing(false);
    }
  }, []);

  const stopRecording = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      resolveRef.current = resolve;
      rejectRef.current = reject;

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        console.log('[Voz Manual] Deteniendo grabación manualmente...');
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.error('[Voz Manual] Error al detener:', e);
          reject(e);
        }
      } else {
        reject(new Error('No recording in progress'));
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

          // Timeout de seguridad aumentado a 15 segundos
          setTimeout(() => {
            try { recognition.stop(); } catch {}
          }, 15000);
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
          }
        });
        
        streamRef.current = stream;
        audioChunksRef.current = [];
        
        // Detectar el mejor formato de audio disponible
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/mp4';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = '';
            }
          }
        }
        console.log('[Voz Backend] Formato de audio:', mimeType || 'default');

        const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current = mr;

        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            console.log('[Voz Backend] Chunk recibido:', e.data.size, 'bytes');
            audioChunksRef.current.push(e.data);
          }
        };

        mr.onerror = (e) => {
          console.error('[Voz Backend] Error en MediaRecorder:', e);
        };

        mr.onstop = async () => {
          console.log('[Voz Backend] Grabación detenida, procesando...');
          console.log('[Voz Backend] Total de chunks:', audioChunksRef.current.length);
          setIsRecording(false);

          if (audioChunksRef.current.length === 0) {
            console.error('[Voz Backend] Sin chunks de audio capturados');
            setIsProcessing(false);
            stream.getTracks().forEach(t => t.stop());
            toast.error('No se capturó audio. Intenta hablar más fuerte.');
            return reject(new Error('No audio captured'));
          }

          const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
          console.log('[Voz Backend] Blob creado:', blob.size, 'bytes, tipo:', blob.type);

          // Validar tamaño mínimo de 500 bytes
          if (blob.size < 500) {
            console.error('[Voz Backend] Audio muy corto:', blob.size, 'bytes');
            setIsProcessing(false);
            stream.getTracks().forEach(t => t.stop());
            toast.error('Audio muy corto. Habla por al menos 1 segundo.');
            return reject(new Error('Audio too short'));
          }

          try {
            // Timeout de 10 segundos para la transcripción
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Transcription timeout')), 10000);
            });

            const reader = new FileReader();
            reader.readAsDataURL(blob);
            
            reader.onloadend = async () => {
              const base64 = reader.result?.toString().split(',')[1];
              if (!base64) {
                console.error('[Voz Backend] Error convirtiendo a base64');
                setIsProcessing(false);
                stream.getTracks().forEach(t => t.stop());
                return reject(new Error('Base64 conversion failed'));
              }

              console.log('[Voz Backend] Base64 generado:', base64.length, 'chars');
              console.log('[Voz Backend] Enviando a transcribe-audio...');

              try {
                const transcriptionPromise = supabase.functions.invoke('transcribe-audio', {
                  body: { audio: base64 }
                });

                const { data, error } = await Promise.race([transcriptionPromise, timeoutPromise]) as any;

                if (error) {
                  console.error('[Voz Backend] Error de función:', error);
                  throw error;
                }

                if (data?.text) {
                  console.log('[Voz Backend] Transcripción exitosa:', data.text);
                  resolve(data.text);
                } else {
                  throw new Error('No se recibió transcripción');
                }
              } catch (e: any) {
                console.error('[Voz Backend] Error en transcripción:', e);
                if (e.message === 'Transcription timeout') {
                  toast.error('La transcripción tardó demasiado. Intenta de nuevo.');
                }
                reject(e);
              } finally {
                setIsProcessing(false);
                stream.getTracks().forEach(t => t.stop());
              }
            };

            reader.onerror = () => {
              console.error('[Voz Backend] Error en FileReader');
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

        // Iniciar grabación con timeslice de 500ms
        mr.start(500);
        console.log('[Voz Backend] MediaRecorder iniciado en modo automático');
        
        // Auto-detener después de 30 segundos máximo (modo automático)
        const autoStopTimer = setTimeout(() => {
          if (mr.state === 'recording') {
            console.log('[Voz Backend] Auto-deteniendo después de 30s (límite máximo)');
            try { 
              mr.stop();
            } catch (e) {
              console.error('[Voz Backend] Error al auto-detener:', e);
            }
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
