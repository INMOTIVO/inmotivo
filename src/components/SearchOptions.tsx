import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchOptionsProps {
  searchQuery: string;
  municipality: string;
  sector: string;
}

const SearchOptions = ({ searchQuery, municipality, sector }: SearchOptionsProps) => {
  const navigate = useNavigate();

  const handleFixedView = () => {
    navigate(`/catalogo?query=${encodeURIComponent(searchQuery)}`);
  };

  const handleGPSNavigation = () => {
    navigate(`/navegacion?query=${encodeURIComponent(searchQuery)}&autostart=true`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">¿Cómo quieres buscar?</h2>
        <p className="text-muted-foreground">
          Ubicación actual: {municipality}{sector && `, ${sector}`}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Vista Fija */}
        <Card className="p-8 hover:shadow-xl transition-all duration-300 hover:border-primary/50 cursor-pointer group">
          <div className="space-y-6">
            <div className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
              <Map className="h-10 w-10" />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-2xl font-bold">Ver propiedades cerca</h3>
              <p className="text-muted-foreground">
                Explora un catálogo de propiedades disponibles en tu zona que coincidan con lo que buscas.
              </p>
            </div>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Vista de mapa interactivo
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Filtros avanzados
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Información detallada
              </li>
            </ul>

            <Button 
              onClick={handleFixedView}
              className="w-full"
              size="lg"
            >
              <Map className="mr-2 h-5 w-5" />
              Ver Propiedades
            </Button>
          </div>
        </Card>

        {/* Navegación GPS */}
        <Card className="p-8 hover:shadow-xl transition-all duration-300 hover:border-primary/50 cursor-pointer group border-primary/30">
          <div className="space-y-6">
            <div className="inline-flex p-4 rounded-2xl bg-accent/10 text-accent group-hover:scale-110 transition-transform duration-300">
              <Navigation className="h-10 w-10" />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-2xl font-bold">Navegar con GPS</h3>
              <p className="text-muted-foreground">
                Descubre propiedades mientras te desplazas. Se actualizan en tiempo real según tu ubicación.
              </p>
            </div>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                Navegación en tiempo real
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                Propiedades en 2km alrededor
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                Actualización automática
              </li>
            </ul>

            <Button 
              onClick={handleGPSNavigation}
              variant="default"
              className="w-full bg-gradient-to-r from-accent to-accent/80"
              size="lg"
            >
              <Navigation className="mr-2 h-5 w-5" />
              Iniciar Navegación
            </Button>
          </div>
        </Card>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Tu búsqueda: "{searchQuery}"
      </p>
    </div>
  );
};

export default SearchOptions;
