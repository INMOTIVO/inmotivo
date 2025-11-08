import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Minimal typings for Web Speech API
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
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string | undefined>(undefined);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const recognitionSupportedRef = useRef<boolean>(false);
  const resultResolverRef = useRef<((text: string) => void) | null>(null);
  const resultRejectRef = useRef<((err: any) => void) | null>(null);
  const retriedRef = useRef(false);
  const activeStreamRef = useRef<MediaStream | null>(null);

  // Load devices once (and when permissions change)
  useEffect(() => {
    const loadDevices = async () => {
      try {
        // Request a quick mic access to get device labels
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const all = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = all.filter(d => d.kind === 'audioinput');
        // Filter out stereo mix/system inputs
        const filtered = audioInputs.filter(d => !/stereo mix|mezcla estéreo|mix/i.test(d.label));
        setDevices(filtered.length ? filtered : audioInputs);
        if (!selectedMicId) {
          setSelectedMicId((filtered[0] || audioInputs[0])?.deviceId);
        }
      } catch (e) {
        console.warn('No se pudieron obtener dispositivos de audio:', e);
      }
    };
    loadDevices();
  }, []);

  // Setup recognition support
  useEffect(() => {
    recognitionSupportedRef.current = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  const startAudioLevelMonitor = (stream: MediaStream) => {
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);
    analyserRef.current.fftSize = 256;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        setAudioLevel(average / 255);
        animationFrameRef.current = requestAnimationFrame(update);
      }
    };
    update();
  };

  const stopAudioLevelMonitor = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    setAudioLevel(0);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  // Guard phrases to reject unrelated transcripts once
  const isUnrelated = (t: string) => /subtítulos realizados por la comunidad de amara\.org|amara\.org|subtitulos|subtitles/i.test(t);

  const startRecording = useCallback(async () => {
    try {
      // Prepare the chosen microphone stream (avoid stereo mix)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedMicId ? { exact: selectedMicId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      activeStreamRef.current = stream;
      startAudioLevelMonitor(stream);

      // Prefer Web Speech API if available
      const SR: any = (window.SpeechRecognition || window.webkitSpeechRecognition);
      if (SR) {
        const recognition = new SR();
        recognition.lang = 'es-CO';
        recognition.interimResults = false;
        recognition.continuous = false;
        try { recognition.maxAlternatives = 1; } catch {}
        recognitionRef.current = recognition;
        retriedRef.current = false;

        console.log('[Voz] Iniciando reconocimiento', {
          lang: recognition.lang,
          deviceId: selectedMicId || 'default',
        });

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            if (res.isFinal) {
              finalTranscript = (res[0]?.transcript || '').trim();
              const confidence = res[0]?.confidence;
              console.log('[Voz] Resultado final', { lang: recognition.lang, confidence, text: finalTranscript });
              if (isUnrelated(finalTranscript) && !retriedRef.current) {
                retriedRef.current = true;
                console.warn('[Voz] Transcript no relacionado, reintentando 1 vez...');
                try { recognition.stop(); } catch {}
                setTimeout(() => {
                  try { recognition.start(); } catch (e) { console.error(e); }
                }, 150);
                return;
              }
              resultResolverRef.current?.(finalTranscript);
              resultResolverRef.current = null;
              resultRejectRef.current = null;
            }
          }
        };

        recognition.onerror = (e: any) => {
          console.error('[Voz] Error reconocimiento', e);
          // Fallback to backend if recognition fails
          recognitionRef.current = null;
          toast.info('Cambiando a modo de transcripción en servidor...');
          // We keep recording and will use MediaRecorder path on stop
        };

        recognition.onend = () => {
          setIsRecording(false);
          stopAudioLevelMonitor();
          if (activeStreamRef.current) {
            activeStreamRef.current.getTracks().forEach(t => t.stop());
            activeStreamRef.current = null;
          }
        };

        recognition.start();
        setIsRecording(true);
        toast.success('Escuchando... (es-CO)', { duration: 1200 });
        return;
      }

      // Fallback: record and send to backend Whisper
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Grabando... Habla ahora', { duration: 1200 });
    } catch (error) {
      console.error('Error accediendo al micrófono:', error);
      toast.error('No se pudo acceder al micrófono');
      setIsRecording(false);
    }
  }, [selectedMicId]);

  const stopRecording = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      setIsProcessing(true);

      // If using Web Speech API
      if (recognitionRef.current) {
        resultResolverRef.current = (t: string) => {
          setIsProcessing(false);
          resolve(t);
        };
        resultRejectRef.current = (err) => {
          setIsProcessing(false);
          reject(err);
        };
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('[Voz] Error al detener reconocimiento', e);
        }
        return;
      }

      // Fallback to MediaRecorder + Whisper edge function
      if (mediaRecorderRef.current && isRecording) {
        const mediaRecorder = mediaRecorderRef.current;
        mediaRecorder.onstop = async () => {
          setIsRecording(false);
          stopAudioLevelMonitor();
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
              console.log('[Voz] Enviando a transcribe-audio con es-CO');
              const { data, error } = await supabase.functions.invoke('transcribe-audio', {
                body: { audio: base64 }
              });
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
              if (mediaRecorder.stream) mediaRecorder.stream.getTracks().forEach(t => t.stop());
              if (activeStreamRef.current) {
                activeStreamRef.current.getTracks().forEach(t => t.stop());
                activeStreamRef.current = null;
              }
            }
          };
        };
        try { mediaRecorder.stop(); } catch {}
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
    // Device selection support
    devices,
    selectedMicId,
    setSelectedMicId,
  };
};
