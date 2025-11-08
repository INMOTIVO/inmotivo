import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { seedLocationsToDatabase } from '@/utils/seedLocations';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

const SeedLocations = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setIsSeeding(true);
    setError(null);
    setIsComplete(false);

    try {
      await seedLocationsToDatabase();
      setIsComplete(true);
      toast.success('Datos de ubicaciones cargados exitosamente');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error('Error al cargar datos: ' + errorMessage);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              <CardTitle>Poblar Base de Datos de Ubicaciones</CardTitle>
            </div>
            <CardDescription>
              Esta herramienta cargará todos los departamentos, municipios y barrios de Colombia
              en la base de datos. Solo necesitas ejecutar esto una vez.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isComplete && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-green-900 font-medium">
                  ¡Datos cargados exitosamente! Puedes cerrar esta página.
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-900 font-medium">{error}</p>
              </div>
            )}

            <Button
              onClick={handleSeed}
              disabled={isSeeding || isComplete}
              size="lg"
              className="w-full"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Cargando datos...
                </>
              ) : isComplete ? (
                'Completado'
              ) : (
                'Iniciar Carga de Datos'
              )}
            </Button>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Este proceso puede tomar varios minutos</p>
              <p>• Se cargarán 33 departamentos con todos sus municipios y barrios</p>
              <p>• No cierres esta página hasta que el proceso termine</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SeedLocations;
