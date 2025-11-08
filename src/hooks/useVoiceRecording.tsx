import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Request specific audio constraints for better voice capture
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimal for Whisper API
          channelCount: 1
        } 
      });

      console.log('Audio stream started with tracks:', stream.getAudioTracks().map(t => ({
        label: t.label,
        settings: t.getSettings()
      })));

      // Setup audio analyzer for visual feedback
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average / 255);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      updateAudioLevel();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Audio chunk received, size:', event.data.size);
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);
        setAudioLevel(0);

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Audio blob created, size:', audioBlob.size, 'bytes');
        
        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          
          if (!base64Audio) {
            toast.error('Error al procesar el audio');
            setIsProcessing(false);
            return;
          }

          try {
            console.log('Sending audio to transcribe, base64 length:', base64Audio.length);
            // Use Whisper API through edge function
            const { data, error } = await supabase.functions.invoke('transcribe-audio', {
              body: { audio: base64Audio }
            });

            if (error) throw error;

            if (data?.text) {
              console.log('Transcription received:', data.text);
              return data.text;
            } else {
              throw new Error('No se recibió transcripción');
            }
          } catch (error) {
            console.error('Error transcribing:', error);
            toast.error('Error al transcribir el audio');
            throw error;
          } finally {
            setIsProcessing(false);
            stream.getTracks().forEach(track => track.stop());
            if (audioContextRef.current) {
              audioContextRef.current.close();
            }
          }
        };
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      toast.success('🎤 Grabando... Habla claramente hacia el micrófono', { duration: 3000 });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error('Permiso de micrófono denegado. Por favor permite el acceso al micrófono.');
      } else {
        toast.error('No se pudo acceder al micrófono');
      }
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (mediaRecorderRef.current && isRecording) {
        const mediaRecorder = mediaRecorderRef.current;
        
        mediaRecorder.onstop = async () => {
          setIsRecording(false);
          setIsProcessing(true);
          setAudioLevel(0);

          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log('Stopping recording, audio blob size:', audioBlob.size, 'bytes');
          
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          
          reader.onloadend = async () => {
            const base64Audio = reader.result?.toString().split(',')[1];
            
            if (!base64Audio) {
              toast.error('Error al procesar el audio');
              setIsProcessing(false);
              reject(new Error('Error processing audio'));
              return;
            }

            try {
              console.log('Sending audio to transcribe, base64 length:', base64Audio.length);
              const { data, error } = await supabase.functions.invoke('transcribe-audio', {
                body: { audio: base64Audio }
              });

              if (error) throw error;

              if (data?.text) {
                console.log('Transcription received:', data.text);
                toast.success('Audio transcrito correctamente');
                resolve(data.text);
              } else {
                throw new Error('No se recibió transcripción');
              }
            } catch (error) {
              console.error('Error transcribing:', error);
              toast.error('Error al transcribir el audio');
              reject(error);
            } finally {
              setIsProcessing(false);
              if (mediaRecorder.stream) {
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
              }
              if (audioContextRef.current) {
                audioContextRef.current.close();
              }
            }
          };
        };

        mediaRecorder.stop();
      } else {
        reject(new Error('No recording in progress'));
      }
    });
  }, [isRecording]);

  return {
    isRecording,
    isProcessing,
    audioLevel,
    startRecording,
    stopRecording
  };
};
