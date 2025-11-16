import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Navigation, List } from "lucide-react";

interface SearchModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateGPS: () => void;
  onViewProperties: () => void;
}

const SearchModeDialog = ({ 
  open, 
  onOpenChange, 
  onNavigateGPS, 
  onViewProperties 
}: SearchModeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            ¿Cómo quieres buscar propiedades?
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Opción Navegar con GPS */}
          <Button
            onClick={onNavigateGPS}
            className="h-auto p-6 flex flex-col items-center gap-3 hover:scale-105 transition-transform"
            variant="outline"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Navigation className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg mb-1">Navegar con GPS</div>
              <div className="text-sm text-muted-foreground font-normal">
                Descubre propiedades mientras te desplazas
              </div>
            </div>
          </Button>

          {/* Opción Ver propiedades */}
          <Button
            onClick={onViewProperties}
            className="h-auto p-6 flex flex-col items-center gap-3 hover:scale-105 transition-transform"
            variant="outline"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <List className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg mb-1">Ver propiedades</div>
              <div className="text-sm text-muted-foreground font-normal">
                Explora el catálogo completo
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchModeDialog;
