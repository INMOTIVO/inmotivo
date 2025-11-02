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
    navigate(`/navegacion?query=${encodeURIComponent(editedQuery)}&autostart=true`);
  };
  return <div className="w-full max-w-4xl mx-auto space-y-3 md:space-y-4 animate-fade-in px-4">
      <div className="text-center space-y-1">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">¿Cómo quieres buscar?</h2>
        <p className="text-sm md:text-lg text-white/90">
          Ubicación actual: {municipality}{sector && `, ${sector}`}
        </p>
      </div>

      <div className={`grid ${disableGPSNavigation ? 'md:grid-cols-1 max-w-md mx-auto' : 'md:grid-cols-2'} gap-3 md:gap-5`}>
        {/* Navegación GPS */}
        {!disableGPSNavigation && (
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
        )}

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
        <div 
          className="inline-flex items-center gap-2 bg-white/95 px-4 md:px-6 py-2 md:py-3 rounded-full border border-primary/20 shadow-lg max-w-full cursor-pointer hover:bg-white transition-colors"
          onClick={() => !isEditing && handleStartEdit()}
        >
          <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">Tu búsqueda:</span>
          {isEditing ? (
            <>
              <Input
                value={editedQuery}
                onChange={(e) => setEditedQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                className="h-7 text-xs md:text-sm font-semibold border-0 focus-visible:ring-1 px-2"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveEdit();
                }}
              >
                ✓
              </Button>
            </>
          ) : (
            <>
              <span className="text-xs md:text-sm font-semibold text-foreground truncate">
                "{editedQuery}"
              </span>
              <Edit2 className="h-3 w-3 text-muted-foreground" />
            </>
          )}
        </div>
      </div>
    </div>;
};
export default SearchOptions;