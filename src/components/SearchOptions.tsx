import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
interface SearchOptionsProps {
  searchQuery: string;
  municipality: string;
  sector: string;
}
const SearchOptions = ({
  searchQuery,
  municipality,
  sector
}: SearchOptionsProps) => {
  const navigate = useNavigate();
  const handleFixedView = () => {
    navigate(`/catalogo?query=${encodeURIComponent(searchQuery)}`);
  };
  const handleGPSNavigation = () => {
    navigate(`/navegacion?query=${encodeURIComponent(searchQuery)}&autostart=true`);
  };
  return <div className="w-full max-w-4xl mx-auto space-y-3 md:space-y-4 animate-fade-in px-4">
      <div className="text-center space-y-1">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">¿Cómo quieres buscar?</h2>
        <p className="text-sm md:text-lg text-white/90">
          Ubicación actual: {municipality}{sector && `, ${sector}`}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-3 md:gap-5">
        {/* Navegación GPS */}
        <Card className="p-3 md:p-6 hover:shadow-xl transition-all duration-300 hover:border-primary/50 cursor-pointer group border-primary/30">
          <div className="flex flex-col h-full space-y-2 md:space-y-4">
            <div className="inline-flex p-2 md:p-3 rounded-2xl bg-accent/10 text-accent group-hover:scale-110 transition-transform duration-300">
              <Navigation className="h-6 w-6 md:h-8 md:w-8" />
            </div>
            
            <div className="space-y-1 md:space-y-2">
              <h3 className="text-base md:text-xl font-bold">Navegar con GPS</h3>
              <p className="text-[11px] md:text-sm text-muted-foreground line-clamp-2">
                Descubre propiedades mientras te desplazas en tiempo real.
              </p>
            </div>

            <ul className="space-y-1 md:space-y-1.5 text-xs md:text-xs text-muted-foreground hidden md:block flex-grow">
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

            <Button onClick={handleGPSNavigation} variant="default" className="w-full bg-gradient-to-r from-accent to-accent/80 mt-auto" size="default">
              <Navigation className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Iniciar Navegación
            </Button>
          </div>
        </Card>

        {/* Vista Fija */}
        <Card className="p-3 md:p-6 hover:shadow-xl transition-all duration-300 hover:border-primary/50 cursor-pointer group">
          <div className="flex flex-col h-full space-y-2 md:space-y-4">
            <div className="inline-flex p-2 md:p-3 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
              <Map className="h-6 w-6 md:h-8 md:w-8" />
            </div>
            
            <div className="space-y-1 md:space-y-2">
              <h3 className="text-base md:text-xl font-bold">Ver propiedades cerca</h3>
              <p className="text-[11px] md:text-sm text-muted-foreground line-clamp-2">
                Explora propiedades disponibles en tu zona.
              </p>
            </div>

            <ul className="space-y-1 md:space-y-1.5 text-xs md:text-xs text-muted-foreground hidden md:block flex-grow">
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

            <Button onClick={handleFixedView} variant="default" size="default" className="w-full mt-auto">
              <Map className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Ver Propiedades
            </Button>
          </div>
        </Card>
      </div>

      <div className="text-center pt-2 animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-white/95 px-4 md:px-6 py-1.5 md:py-2 rounded-full border border-primary/20 shadow-lg max-w-full">
          <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">Tu búsqueda:</span>
          <span className="text-xs md:text-sm font-semibold text-foreground truncate">
            "{searchQuery}"
          </span>
        </div>
      </div>
    </div>;
};
export default SearchOptions;