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
  const recognitionRef = useRef<any>(null);

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
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("Tu navegador no soporta reconocimiento de voz. Intenta con Chrome o Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
      toast.success("Escuchando... Habla ahora");
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      await handleInterpretSearch(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Error en reconocimiento de voz:', event.error);
      setIsRecording(false);
      toast.error("No se pudo procesar el audio. Intenta de nuevo.");
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
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
