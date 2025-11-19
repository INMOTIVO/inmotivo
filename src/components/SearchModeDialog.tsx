import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Navigation, List } from "lucide-react";

// 🟢 AGREGA ESTA INTERFAZ COMPLETA
interface SearchModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateGPS: () => void;
  onViewProperties: () => void;
  isUsingCurrentLocation: boolean; // 👈 IMPORTANTE
}

const SearchModeDialog = ({
  open,
  onOpenChange,
  onNavigateGPS,
  onViewProperties,
  isUsingCurrentLocation,
}: SearchModeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl p-6 max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            ¿Cómo quieres buscar propiedades?
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">

          {/* 🟢 OPCIÓN 1 — NAVEGAR CON GPS */}
          <Button
            onClick={onNavigateGPS}
            className="h-auto p-6 flex flex-col items-center gap-3 hover:scale-[1.02] transition-transform rounded-xl border"
            variant="outline"
          >
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <Navigation className="h-7 w-7 text-green-600" />
            </div>

            <div className="text-center">
              <div className="font-semibold text-lg mb-1">Navegar con GPS</div>

              <div className="text-sm text-gray-600 font-normal">
                {isUsingCurrentLocation
                  ? "Descubre propiedades mientras te desplazas"
                  : "Ver en el mapa"}
              </div>
            </div>
          </Button>

          {/* 🟢 OPCIÓN 2 — VER PROPIEDADES */}
          <Button
            onClick={onViewProperties}
            className="h-auto p-6 flex flex-col items-center gap-3 hover:scale-[1.02] transition-transform rounded-xl border"
            variant="outline"
          >
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <List className="h-7 w-7 text-green-600" />
            </div>

            <div className="text-center">
              <div className="font-semibold text-lg mb-1">Ver propiedades</div>
              <div className="text-sm text-gray-600 font-normal">
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
