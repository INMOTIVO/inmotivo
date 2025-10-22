import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import heroImage from "@/assets/hero-medellin.jpg";
import { toast } from "sonner";
import SearchOptions from './SearchOptions';
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

const Hero = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("Medellín");
  const [municipality, setMunicipality] = useState("");
  const [sector, setSector] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showFixedSearch, setShowFixedSearch] = useState(false);
  const isMobile = useIsMobile();

  // Check if we should show options from URL params
  useEffect(() => {
    const query = searchParams.get('query');
    const shouldShowOptions = searchParams.get('showOptions') === 'true';
    
    if (query && shouldShowOptions) {
      setSearchQuery(query);
      setShowOptions(true);
    }
  }, [searchParams]);

  // Detect scroll to show/hide fixed search bar on mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const heroHeight = window.innerHeight * 0.6; // Show after scrolling 60% of hero
      
      setShowFixedSearch(scrollPosition > heroHeight);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  useEffect(() => {
    // Get user's current location on component mount
    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        toast.error("Geolocalización no disponible en tu navegador");
        return;
      }

      setLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Use Nominatim API for reverse geocoding
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
              {
                headers: {
                  'Accept-Language': 'es'
                }
              }
            );
            
            if (!response.ok) throw new Error("Error al obtener la ubicación");
            
            const data = await response.json();
            const address = data.address;
            
            // Extract municipality and sector
            const municipalityName = address.city || address.town || address.municipality || address.county || "Medellín";
            const sectorName = address.suburb || address.neighbourhood || address.quarter || address.village || "";
            
            setMunicipality(municipalityName);
            setSector(sectorName);
            setLocation(sectorName ? `${municipalityName}, ${sectorName}` : municipalityName);
            
            toast.success("Ubicación detectada");
          } catch (error) {
            console.error("Error getting location:", error);
            toast.error("No se pudo obtener la ubicación exacta");
          } finally {
            setLoadingLocation(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLoadingLocation(false);
          if (error.code === error.PERMISSION_DENIED) {
            toast.error("Permiso de ubicación denegado");
          } else {
            toast.error("No se pudo obtener tu ubicación");
          }
        }
      );
    };

    getCurrentLocation();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Por favor describe qué buscas");
      return;
    }

    // Validar que la búsqueda sea sobre inmuebles
    try {
      const { data, error } = await supabase.functions.invoke('interpret-search', {
        body: { query: searchQuery.trim() }
      });

      if (error) throw error;

      // Verificar si la consulta no es válida
      if (data?.error === 'invalid_query') {
        toast.error(data.message, {
          duration: 5000,
          description: "💡 Ejemplo: 'Apartamento de 2 habitaciones cerca del metro'"
        });
        return;
      }

      // Si es válida, continuar con el flujo normal
      setShowOptions(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error validating search:', err);
      toast.error("Error al validar la búsqueda");
    }
  };

  if (showOptions) {
    return (
      <section className="fixed inset-0 top-16 flex items-center justify-center overflow-hidden z-50">
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/50 via-primary/40 to-blue-600/50" />
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20 overflow-y-auto max-h-full">
          <SearchOptions 
            searchQuery={searchQuery}
            municipality={municipality || "Medellín"}
            sector={sector}
          />
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="relative min-h-[60vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background image with gradient overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/50 via-primary/40 to-blue-600/50" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-8 md:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                Encuentra tu <span className="text-primary-glow">lugar ideal</span>
                <br />
                de manera <span className="text-accent">inteligente</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
                Describe lo que buscas y descubre propiedades cerca a ti mientras navegas por la ciudad.
              </p>
            </div>

            {/* Search bar */}
            <div className="relative max-w-2xl mx-auto" style={{ perspective: '1000px' }}>
              {/* Animated border glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[gradient-flow_3s_linear_infinite] opacity-75 blur-sm"></div>
              
              <div className="relative bg-white rounded-2xl shadow-2xl p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Search className="h-4 w-4 text-muted-foreground mt-2" />
                    <Textarea
                      placeholder="Cuéntame qué buscas... Ej: Apartamento de 2 habitaciones, cerca del metro"
                      className="border-0 focus-visible:ring-0 text-sm resize-none min-h-[50px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSearch();
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {loadingLocation ? (
                      <>
                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                        <span className="text-xs text-muted-foreground">Detectando ubicación...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          {municipality && sector ? (
                            <div>
                              <div className="text-xs font-medium">{municipality}</div>
                              <div className="text-[10px] text-muted-foreground">{sector}</div>
                            </div>
                          ) : municipality ? (
                            <div className="text-xs font-medium">{municipality}</div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Ubicación actual</span>
                          )}
                        </div>
                        <Button 
                          variant="hero" 
                          size="default"
                          onClick={handleSearch}
                          disabled={!searchQuery.trim()}
                        >
                          Buscar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-glow/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
      </section>

      {/* Fixed search bar for mobile when scrolling */}
      {isMobile && showFixedSearch && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl border-t border-border/50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="¿Qué buscas?"
                className="flex-1 border-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              <Button 
                variant="hero" 
                size="sm"
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
                className="flex-shrink-0"
              >
                Buscar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Hero;
