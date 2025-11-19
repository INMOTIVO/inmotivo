import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navigation, List } from "lucide-react";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/hero-medellin.jpg";

const SearchModePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Leer datos del state
  const searchData = location.state as {
    query: string;
    listingType: "rent" | "sale";
    location?: { lat: number; lng: number; address: string };
    semanticFilters?: string;
    isUsingCurrentLocation?: boolean;
  } | null;

  // Valores con fallback
  const query = searchData?.query || "";
  const listingType = searchData?.listingType || "rent";
  const lat = searchData?.location?.lat;
  const lng = searchData?.location?.lng;
  const locationAddress = searchData?.location?.address || "";
  const semanticFilters = searchData?.semanticFilters || "";
  const isUsingCurrentLocation = searchData?.isUsingCurrentLocation || false;

  const handleNavigateGPS = () => {
    const navParams = new URLSearchParams();
    navParams.append("query", query);
    navParams.append("listingType", listingType);

    if (lat && lng) {
      navParams.append("lat", lat.toString());
      navParams.append("lng", lng.toString());
      navParams.append("location", locationAddress);
    }

    navigate(`/navegacion?${navParams.toString()}`);
  };

  const handleViewProperties = () => {
    const params = new URLSearchParams();
    params.append("query", query);
    params.append("listingType", listingType);

    if (lat && lng) {
      params.append("lat", lat.toString());
      params.append("lng", lng.toString());
      params.append("location", locationAddress);
    }

    if (semanticFilters) {
      params.append("semanticFilters", semanticFilters);
    }

    navigate(`/catalogo?${params.toString()}`);
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col">
      {/* Header Navbar */}
      <Navbar />

      {/* Fondo heroImage con overlay */}
      <div className="absolute inset-0 w-full h-full -z-10">
        <img 
          src={heroImage} 
          alt="Medellín cityscape" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Contenido principal (debajo del header) */}
      <div className="relative flex-1 flex items-center justify-center pt-20 pb-12 px-4">
        <div className="w-full max-w-2xl">
          {/* Título centrado */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg">
              ¿Cómo quieres buscar propiedades?
            </h1>
            <p className="text-base md:text-lg text-white/90 drop-shadow-md">
              Elige el modo que mejor se adapte a tu búsqueda
            </p>
          </div>

          {/* Contenedor cápsula con gradiente animado */}
          <div className="relative max-w-2xl mx-auto w-full">
            {/* Gradiente animado del borde */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-blue-500 to-primary rounded-3xl blur-sm opacity-75 animate-pulse" />
            
            {/* Cápsula blanca con contenido */}
            <div className="relative bg-white rounded-3xl shadow-2xl p-6 md:p-8 animate-in slide-in-from-bottom-4 fade-in duration-300">
              {/* Grid de opciones */}
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
      </div>
    </div>
  );
};

export default SearchModePage;
