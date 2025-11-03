import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Loader2, Send } from 'lucide-react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import VoiceButton from './VoiceButton';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const { isRecording, isProcessing: isTranscribing, audioLevel, startRecording, stopRecording } = useVoiceRecording();

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

      // Manejar errores HTTP (status 400)
      if (error instanceof FunctionsHttpError) {
        const errorData = await error.context.json();
        if (errorData.error === 'invalid_query') {
          toast.error(errorData.message || "Esta búsqueda no es sobre propiedades", {
            duration: 5000,
            description: "💡 Ejemplo: 'Apartamento de 2 habitaciones cerca del metro'"
          });
          setIsProcessing(false);
          return;
        }
      }

      if (error) {
        throw error;
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

  const handleVoiceRecording = async () => {
    if (isRecording) {
      try {
        const transcript = await stopRecording();
        setSearchQuery(transcript);
        await handleInterpretSearch(transcript);
      } catch (error) {
        console.error('Error with voice recording:', error);
      }
    } else {
      startRecording();
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
          disabled={isProcessing || isRecording || isTranscribing || !searchQuery.trim()}
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

        <VoiceButton
          isRecording={isRecording}
          isProcessing={isTranscribing}
          audioLevel={audioLevel}
          onStart={handleVoiceRecording}
          onStop={handleVoiceRecording}
          disabled={isProcessing}
          variant="outline"
          size="icon"
        />
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
