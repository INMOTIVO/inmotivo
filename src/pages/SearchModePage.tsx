import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navigation, List } from "lucide-react";

const SearchModePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Leer datos de la URL
  const query = searchParams.get("query") || "";
  const listingType = searchParams.get("listingType") || "rent";
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const location = searchParams.get("location") || "";
  const semanticFilters = searchParams.get("semanticFilters") || "";
  const isUsingCurrentLocation = searchParams.get("isUsingCurrentLocation") === "true";

  const handleNavigateGPS = () => {
    const navParams = new URLSearchParams();
    navParams.append("query", query);
    navParams.append("listingType", listingType);

    if (lat && lng) {
      navParams.append("lat", lat);
      navParams.append("lng", lng);
      navParams.append("location", location);
    }

    navigate(`/navegacion?${navParams.toString()}`);
  };

  const handleViewProperties = () => {
    const params = new URLSearchParams();
    params.append("query", query);
    params.append("listingType", listingType);

    if (lat && lng) {
      params.append("lat", lat);
      params.append("lng", lng);
      params.append("location", location);
    }

    if (semanticFilters) {
      params.append("semanticFilters", semanticFilters);
    }

    navigate(`/catalogo?${params.toString()}`);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Fondo con blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Contenedor central con animación iOS */}
      <div className="relative h-full flex items-end md:items-center justify-center p-4">
        <div className="w-full max-w-lg bg-background rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Título */}
          <h1 className="text-center text-xl font-bold mb-6 text-foreground">
            ¿Cómo quieres buscar propiedades?
          </h1>

          {/* Opciones */}
          <div className="grid gap-4">
            {/* Opción 1: Navegar con GPS */}
            <Button
              onClick={handleNavigateGPS}
              className="h-auto p-6 flex flex-col items-center gap-3 hover:scale-[1.02] transition-transform rounded-xl border"
              variant="outline"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Navigation className="h-7 w-7 text-primary" />
              </div>

              <div className="text-center">
                <div className="font-semibold text-lg mb-1">Navegar con GPS</div>
                <div className="text-sm text-muted-foreground font-normal">
                  {isUsingCurrentLocation
                    ? "Descubre propiedades mientras te desplazas"
                    : "Ver en el mapa"}
                </div>
              </div>
            </Button>

            {/* Opción 2: Ver propiedades */}
            <Button
              onClick={handleViewProperties}
              className="h-auto p-6 flex flex-col items-center gap-3 hover:scale-[1.02] transition-transform rounded-xl border"
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
        </div>
      </div>
    </div>
  );
};

export default SearchModePage;
