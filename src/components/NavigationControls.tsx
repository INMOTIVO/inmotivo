import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Navigation, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface NavigationControlsProps {
  onStartNavigation: (destination: [number, number], criteria: string, filters: any) => void;
  initialCriteria?: string;
}

const NavigationControls = ({ onStartNavigation, initialCriteria = '' }: NavigationControlsProps) => {
  const [destination, setDestination] = useState('');
  const [criteria, setCriteria] = useState(initialCriteria);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartNavigation = async () => {
    if (!destination.trim()) {
      toast.error('Por favor ingresa un destino');
      return;
    }

    setIsProcessing(true);
    try {
      // Interpret search criteria using the existing function
      const searchQuery = `${criteria} en ${destination}`;
      const { data, error } = await supabase.functions.invoke('interpret-search', {
        body: { query: searchQuery }
      });

      if (error) throw error;

      // Verificar si la consulta no es válida
      if (data?.error === 'invalid_query') {
        toast.error(data.message, {
          duration: 5000,
          description: "💡 Ejemplo: 'Casa con jardín y parqueadero'"
        });
        return;
      }

      const filters = data?.filters || {};
      
      // Geocode the destination
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination + ', Colombia')}&limit=1`
      );
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.length === 0) {
        toast.error('No se encontró el destino');
        return;
      }

      const destinationCoords: [number, number] = [
        parseFloat(geocodeData[0].lat),
        parseFloat(geocodeData[0].lon)
      ];

      toast.success('Iniciando navegación');
      onStartNavigation(destinationCoords, criteria, filters);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al iniciar la navegación');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Navegación GPS</h1>
          <p className="text-muted-foreground">
            Encuentra propiedades mientras te desplazas hacia tu destino
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="destination">Destino</Label>
            <Input
              id="destination"
              placeholder="Ej: Sabaneta, El Poblado, Envigado..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="criteria">Características que buscas</Label>
            <Textarea
              id="criteria"
              placeholder="Ej: Apartamento de 3 habitaciones, con parqueadero, cerca del metro..."
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>

          <Button
            onClick={handleStartNavigation}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Navigation className="mr-2 h-5 w-5" />
                IR
              </>
            )}
          </Button>
        </div>

        <div className="bg-muted p-4 rounded-lg text-sm">
          <p className="font-medium mb-2">💡 Ejemplos de búsqueda:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• "Casa de 4 habitaciones con jardín"</li>
            <li>• "Apartamento amoblado cerca del metro"</li>
            <li>• "Local comercial con parqueadero"</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default NavigationControls;
