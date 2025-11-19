import { useNavigate, useLocation } from "react-router-dom";
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
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl md:text-5xl font-semibold text-white mb-4 drop-shadow-2xl tracking-tight">
              ¿Cómo quieres buscar propiedades?
            </h1>
            <p className="text-sm md:text-base text-white/70 drop-shadow-lg font-light tracking-wide">
              Elige el modo que mejor se adapte a tu búsqueda
            </p>
          </div>

          {/* Contenedor minimalista sin fondo */}
          <div className="max-w-xl mx-auto w-full space-y-4 animate-in slide-in-from-bottom-6 fade-in duration-700">
                {/* Opción 1: Navegar con GPS */}
                <button
                  onClick={handleNavigateGPS}
                  className="group relative w-full bg-white/80 backdrop-blur-md hover:bg-white/95 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1 active:scale-[0.98]"
                >
                  {/* Subtle top border accent */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  
                  <div className="flex items-center gap-5">
                    {/* Icono más grande y limpio */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Navigation className="h-8 w-8 text-primary" strokeWidth={1.5} />
                    </div>
                    
                    {/* Contenido alineado a la izquierda */}
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-lg text-gray-900 mb-1 group-hover:text-primary transition-colors">
                        Navegar con GPS
                      </div>
                      <div className="text-sm text-gray-500 font-normal leading-relaxed">
                        {isUsingCurrentLocation
                          ? "Descubre propiedades mientras te desplazas"
                          : "Ver en el mapa"}
                      </div>
                    </div>
                    
                    {/* Chevron indicator */}
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* Opción 2: Ver propiedades */}
                <button
                  onClick={handleViewProperties}
                  className="group relative w-full bg-white/80 backdrop-blur-md hover:bg-white/95 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1 active:scale-[0.98]"
                >
                  {/* Subtle top border accent */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  
                  <div className="flex items-center gap-5">
                    {/* Icono más grande y limpio */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <List className="h-8 w-8 text-primary" strokeWidth={1.5} />
                    </div>
                    
                    {/* Contenido alineado a la izquierda */}
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-lg text-gray-900 mb-1 group-hover:text-primary transition-colors">
                        Ver propiedades
                      </div>
                      <div className="text-sm text-gray-500 font-normal leading-relaxed">
                        Explora el catálogo completo
                      </div>
                    </div>
                    
                    {/* Chevron indicator */}
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModePage;
