import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Map, Navigation, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
interface SearchOptionsProps {
  searchQuery: string;
  municipality: string;
  sector: string;
  onSearchChange?: (newQuery: string) => void;
  disableGPSNavigation?: boolean;
}
const SearchOptions = ({
  searchQuery,
  municipality,
  sector,
  onSearchChange,
  disableGPSNavigation = false
}: SearchOptionsProps) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuery, setEditedQuery] = useState(searchQuery);
  const [isStartingNav, setIsStartingNav] = useState(false);
  const handleStartEdit = () => {
    setEditedQuery(searchQuery);
    setIsEditing(true);
  };
  const handleSaveEdit = () => {
    if (editedQuery.trim()) {
      onSearchChange?.(editedQuery);
      setIsEditing(false);
      toast.success("Búsqueda actualizada");
    }
  };
  const handleFixedView = () => {
    navigate(`/catalogo?query=${encodeURIComponent(editedQuery)}`);
  };
  const handleGPSNavigation = () => {
    setIsStartingNav(true);
    // Navegar inmediatamente sin delay
    navigate(`/navegacion?query=${encodeURIComponent(editedQuery)}&autostart=true`);
  };
  return <div className="w-full max-w-4xl mx-auto space-y-1 md:space-y-2 animate-fade-in px-4">
      <div className="text-center space-y-1">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-50">¿Cómo quieres buscar?</h2>
        <p className="text-sm md:text-lg text-white/90">
          Ubicación actual: {municipality}{sector && `, ${sector}`}
        </p>
      </div>

      <div className={`grid ${disableGPSNavigation ? 'md:grid-cols-1 max-w-md mx-auto' : 'md:grid-cols-2'} gap-3 md:gap-5`}>
        {/* Navegación GPS */}
        {!disableGPSNavigation && <Card onClick={handleGPSNavigation} className="p-4 md:p-8 hover:shadow-xl transition-all duration-300 hover:border-primary/50 cursor-pointer group border-primary/30">
            <div className="flex flex-col h-full space-y-3 md:space-y-5 pointer-events-none">
              <div className="inline-flex p-3 md:p-4 rounded-2xl bg-accent/10 text-accent group-hover:scale-110 transition-transform duration-300">
                <Navigation className="h-8 w-8 md:h-10 md:w-10" />
              </div>
              
              <div className="space-y-1.5 md:space-y-2">
                <h3 className="text-lg md:text-2xl font-bold">Navegar con GPS</h3>
                <p className="text-xs md:text-base text-muted-foreground line-clamp-2">
                  Descubre propiedades mientras te desplazas en tiempo real.
                </p>
              </div>

              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-muted-foreground hidden md:block flex-grow">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent" />
                  Navegación en tiempo real
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent" />
                  Propiedades en 2km alrededor
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent" />
                  Actualización automática
                </li>
              </ul>

              <Button variant="default" className="w-full bg-gradient-to-br from-accent via-accent to-accent/70 mt-auto shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 pointer-events-auto" size="lg" disabled={isStartingNav}>
                {isStartingNav ? <>
                    <div className="mr-2 h-5 w-5 md:h-6 md:w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Iniciando...
                  </> : <>
                    <Navigation className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                    Iniciar Navegación
                  </>}
              </Button>
            </div>
          </Card>}

        {/* Vista Fija */}
        <Card className="p-4 md:p-8 hover:shadow-xl transition-all duration-300 hover:border-primary/50 cursor-pointer group">
          <div className="flex flex-col h-full space-y-3 md:space-y-5">
            <div className="inline-flex p-3 md:p-4 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
              <Map className="h-8 w-8 md:h-10 md:w-10" />
            </div>
            
            <div className="space-y-1.5 md:space-y-2">
              <h3 className="text-lg md:text-2xl font-bold">Ver propiedades cerca</h3>
              <p className="text-xs md:text-base text-muted-foreground line-clamp-2">
                Explora propiedades disponibles en tu zona.
              </p>
            </div>

            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-muted-foreground hidden md:block flex-grow">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Vista de mapa interactivo
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Filtros avanzados
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Información detallada
              </li>
            </ul>

            <Button onClick={handleFixedView} variant="default" size="lg" className="w-full mt-auto bg-gradient-to-br from-primary via-primary to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200">
              <Map className="mr-2 h-5 w-5 md:h-6 md:w-6" />
              Ver Propiedades
            </Button>
          </div>
        </Card>
      </div>

    </div>;
};
export default SearchOptions;