import { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Mic, MicOff, Loader2, Send } from 'lucide-react';

interface MapFiltersProps {
  onFiltersChange: (filters: {
    radius: number;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    propertyType?: string;
  }) => void;
  initialQuery?: string;
}

const MapFilters = ({ onFiltersChange, initialQuery = '' }: MapFiltersProps) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (initialQuery) {
      handleInterpretSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleInterpretSearch = async (query: string) => {
    if (!query.trim()) {
      toast.error("Por favor ingresa una búsqueda");
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('interpret-search', {
        body: { query: query.trim() }
      });

      if (error) throw error;

      // Verificar si la consulta no es válida
      if (data?.error === 'invalid_query') {
        toast.error(data.message, {
          duration: 5000,
          description: "💡 Ejemplo: 'Apartamento de 2 habitaciones cerca del metro'"
        });
        return;
      }

      const filters = data.filters;
      onFiltersChange({
        radius: filters.radius || 5,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        bedrooms: filters.bedrooms,
        propertyType: filters.propertyType,
      });

      toast.success("Búsqueda interpretada correctamente");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error al interpretar la búsqueda");
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Grabando... Habla ahora");
    } catch (error) {
      console.error('Error:', error);
      toast.error("No se pudo acceder al micrófono");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        setSearchQuery(data.text);
        await handleInterpretSearch(data.text);
      };
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error al transcribir audio");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Búsqueda inteligente</h3>
        <p className="text-sm text-muted-foreground">
          Describe lo que buscas con tus propias palabras o usa el micrófono
        </p>
      </div>

      <Textarea
        placeholder="Ej: Busco un apartamento de 2 habitaciones cerca de mi ubicación, con precio máximo de 2 millones..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="min-h-[100px]"
        disabled={isProcessing || isRecording}
      />

      <div className="flex gap-2">
        <Button
          onClick={() => handleInterpretSearch(searchQuery)}
          disabled={isProcessing || isRecording || !searchQuery.trim()}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Buscar
            </>
          )}
        </Button>

        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          variant={isRecording ? "destructive" : "outline"}
          size="icon"
        >
          {isRecording ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>💡 Ejemplos de búsqueda:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>"Apartamento 3 habitaciones en El Poblado máximo 3 millones"</li>
          <li>"Casa con jardín cerca de mi ubicación"</li>
          <li>"Local comercial en el centro entre 4 y 6 millones"</li>
        </ul>
      </div>
    </Card>
  );
};

export default MapFilters;
