import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, MapPin, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import heroImage from "@/assets/hero-medellin.jpg";
import { toast } from "sonner";
import SearchOptions from './SearchOptions';
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import VoiceButton from './VoiceButton';

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
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  const [customDepartment, setCustomDepartment] = useState("");
  const [customMunicipality, setCustomMunicipality] = useState("");
  const [customNeighborhood, setCustomNeighborhood] = useState("");
  const isMobile = useIsMobile();
  const { isRecording, isProcessing, audioLevel, startRecording, stopRecording } = useVoiceRecording();

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
        setMunicipality("Medellín");
        setLocation("Medellín");
        return;
      }

      setLoadingLocation(true);
      
      // Timeout para la detección de ubicación
      const timeoutId = setTimeout(() => {
        setLoadingLocation(false);
        setMunicipality("Medellín");
        setLocation("Medellín");
        toast.error("Tiempo agotado. Usando ubicación por defecto", {
          description: "Puedes cambiarla haciendo clic en tu ubicación"
        });
      }, 8000); // 8 segundos timeout

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(timeoutId);
          const { latitude, longitude } = position.coords;
          
          try {
            // Use Nominatim API with timeout
            const controller = new AbortController();
            const fetchTimeout = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
              {
                headers: {
                  'Accept-Language': 'es'
                },
                signal: controller.signal
              }
            );
            
            clearTimeout(fetchTimeout);
            
            if (!response.ok) throw new Error("Error al obtener la ubicación");
            
            const data = await response.json();
            const address = data.address;
            
            // Extract municipality and sector
            const municipalityName = address.city || address.town || address.municipality || address.county || "Medellín";
            const sectorName = address.suburb || address.neighbourhood || address.quarter || address.village || "";
            
            setMunicipality(municipalityName);
            setSector(sectorName);
            setLocation(sectorName ? `${municipalityName}, ${sectorName}` : municipalityName);
            
            toast.success("Ubicación detectada correctamente");
          } catch (error) {
            console.error("Error getting location:", error);
            // Usar ubicación por defecto en caso de error
            setMunicipality("Medellín");
            setLocation("Medellín");
            toast.info("Usando ubicación por defecto: Medellín", {
              description: "Puedes cambiarla haciendo clic en tu ubicación"
            });
          } finally {
            setLoadingLocation(false);
          }
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error("Geolocation error:", error);
          setLoadingLocation(false);
          
          // Siempre establecer una ubicación por defecto
          setMunicipality("Medellín");
          setLocation("Medellín");
          
          if (error.code === error.PERMISSION_DENIED) {
            toast.error("Permiso de ubicación denegado", {
              description: "Usando Medellín como ubicación por defecto"
            });
          } else if (error.code === error.TIMEOUT) {
            toast.error("Tiempo agotado al obtener ubicación", {
              description: "Usando Medellín como ubicación por defecto"
            });
          } else {
            toast.error("Error al obtener ubicación", {
              description: "Usando Medellín como ubicación por defecto"
            });
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 7000, // 7 segundos para GPS
          maximumAge: 0
        }
      );
    };

    getCurrentLocation();
  }, []);

  const handleVoiceRecording = async () => {
    if (isRecording) {
      try {
        const transcript = await stopRecording();
        setSearchQuery(transcript);
        await handleSearch(transcript);
      } catch (error) {
        console.error('Error with voice recording:', error);
      }
    } else {
      startRecording();
    }
  };

  const handleSearch = async (queryText?: string) => {
    const textToSearch = queryText || searchQuery;
    
    if (!textToSearch.trim()) {
      toast.error("Por favor describe qué buscas");
      return;
    }

    // Validar que la búsqueda sea sobre inmuebles
    try {
      const { data, error } = await supabase.functions.invoke('interpret-search', {
        body: { query: textToSearch.trim() }
      });

      // Manejar errores HTTP (status 400)
      if (error instanceof FunctionsHttpError) {
        const errorData = await error.context.json();
        if (errorData.error === 'invalid_query') {
          toast.error(errorData.message || "Esta búsqueda no es sobre propiedades", {
            duration: 5000,
            description: "💡 Ejemplo: 'Apartamento de 2 habitaciones cerca del metro'"
          });
          return;
        }
      }

      if (error) {
        throw error;
      }

      // También manejar respuesta inválida con 200
      if (data?.error === 'invalid_query') {
        toast.error(data.message || "Esta búsqueda no es sobre propiedades", {
          duration: 5000,
          description: data.suggestion || "💡 Ejemplo: 'Apartamento de 2 habitaciones cerca del metro'"
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

  const handleContinueCurrentLocation = () => {
    setUseCustomLocation(false);
    setShowLocationDialog(false);
    toast.success("Usando tu ubicación actual");
  };

  const handleUseCustomLocation = () => {
    if (!customDepartment.trim()) {
      toast.error("El departamento es obligatorio");
      return;
    }
    if (!customMunicipality.trim()) {
      toast.error("El municipio es obligatorio");
      return;
    }
    
    setUseCustomLocation(true);
    const fullLocation = customNeighborhood.trim() 
      ? `${customMunicipality}, ${customNeighborhood}`
      : customMunicipality;
    setMunicipality(customMunicipality);
    setSector(customNeighborhood);
    setShowLocationDialog(false);
    toast.success(`Buscando en: ${customDepartment}, ${fullLocation}`);
  };

  if (showOptions) {
    return (
      <section className="fixed inset-0 top-14 md:top-16 flex flex-col overflow-hidden z-50">
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/50 via-primary/40 to-blue-600/50" />
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 pt-2">
          <Button
            variant="default"
            size="icon"
            onClick={() => setShowOptions(false)}
            className="rounded-full w-12 h-12 shadow-xl bg-primary hover:bg-primary/90"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-4 flex-1 flex items-center justify-center overflow-hidden">
          <SearchOptions
            searchQuery={searchQuery}
            municipality={municipality || "Medellín"}
            sector={sector}
            onSearchChange={(newQuery) => setSearchQuery(newQuery)}
            disableGPSNavigation={useCustomLocation}
          />
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
              <h1 className="text-3xl sm:text-4xl md:text-7xl font-bold text-white leading-tight">
                Encuentra tu <span className="text-primary-glow">lugar ideal</span> de manera <span className="text-accent">inteligente</span>
              </h1>
              <p className="text-base sm:text-lg md:text-2xl text-white/90 max-w-3xl mx-auto px-4">
                Describe lo que buscas y descubre propiedades cerca a ti mientras navegas por la ciudad.
              </p>
            </div>

            {/* Search bar */}
            <div className="relative max-w-2xl mx-auto w-full px-4 sm:px-2">
              {/* Animated border glow */}
              <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[gradient-flow_3s_linear_infinite] opacity-75 blur-sm"></div>
              
              <div className="relative bg-white rounded-xl md:rounded-2xl shadow-2xl p-3 md:p-4">
                <div className="space-y-2 md:space-y-3">
                  <div className="flex items-start gap-2 border border-border rounded-lg p-2">
                    <Search className="h-4 w-4 text-muted-foreground mt-2 flex-shrink-0" />
                    <Textarea
                      placeholder="Describe la propiedad que buscas"
                      className="border-0 focus-visible:ring-0 text-base md:text-sm leading-normal resize-none min-h-[44px] max-h-[96px] md:max-h-[120px] w-full overflow-y-auto"
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t">
                    {loadingLocation ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                        <span className="text-xs text-muted-foreground">Detectando ubicación...</span>
                      </div>
                    ) : (
                      <>
                        <div 
                          className="flex items-center gap-1.5 flex-1 min-w-0 w-full sm:w-auto cursor-pointer hover:opacity-80 transition-opacity justify-center sm:justify-start"
                          onClick={() => setShowLocationDialog(true)}
                        >
                          <MapPin className="h-4 w-4 text-primary animate-bounce flex-shrink-0" />
                          <span className="text-sm font-medium">Tu ubicación:</span>
                          {municipality && sector ? (
                            <span className="text-sm font-medium truncate">{municipality}, {sector}</span>
                          ) : municipality ? (
                            <span className="text-sm font-medium truncate">{municipality}</span>
                          ) : (
                            <span className="text-sm font-medium truncate">Medellín</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Button 
                            variant="hero" 
                            size="lg"
                            onClick={() => handleSearch()}
                            disabled={!searchQuery.trim() || isRecording || isProcessing || loadingLocation}
                            className="flex-1 sm:flex-initial min-w-[120px] text-base font-semibold"
                          >
                            Buscar
                          </Button>
                          <VoiceButton
                            isRecording={isRecording}
                            isProcessing={isProcessing}
                            audioLevel={audioLevel}
                            onStart={handleVoiceRecording}
                            onStop={handleVoiceRecording}
                            disabled={loadingLocation}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative gradient orbs */}
        <div className="absolute top-20 left-10 w-48 h-48 md:w-72 md:h-72 bg-primary-glow/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 md:w-96 md:h-96 bg-blue-400/20 rounded-full blur-3xl" />
      </section>

      {/* Fixed search bar for mobile when scrolling */}
      {isMobile && showFixedSearch && (
        <div className="fixed bottom-6 left-0 right-0 z-50 bg-white shadow-2xl border-t border-border/50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="¿Qué buscas?"
                className="flex-1 border-input text-base leading-normal min-h-[44px] shadow-lg border-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                disabled={isRecording || isProcessing}
              />
              <VoiceButton
                isRecording={isRecording}
                isProcessing={isProcessing}
                audioLevel={audioLevel}
                onStart={handleVoiceRecording}
                onStop={handleVoiceRecording}
                size="icon"
                variant="outline"
              />
              <Button 
                variant="hero" 
                size="sm"
                onClick={() => handleSearch()}
                disabled={!searchQuery.trim() || isRecording || isProcessing}
                className="flex-shrink-0"
              >
                Buscar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Location Selection Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selecciona tu ubicación</DialogTitle>
            <DialogDescription>
              Actualmente estamos usando tu ubicación en tiempo real para buscar inmuebles cerca de ti.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Tu ubicación actual: <span className="font-medium text-foreground">{municipality}{sector && `, ${sector}`}</span>
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleContinueCurrentLocation}
                variant="default"
                className="w-full"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Continuar con ubicación actual
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">O</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Departamento <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Ej: Antioquia"
                    value={customDepartment}
                    onChange={(e) => setCustomDepartment(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Municipio <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Ej: Medellín"
                    value={customMunicipality}
                    onChange={(e) => setCustomMunicipality(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Localidad o Barrio <span className="text-muted-foreground text-xs">(opcional)</span>
                  </label>
                  <Input
                    placeholder="Ej: El Poblado"
                    value={customNeighborhood}
                    onChange={(e) => setCustomNeighborhood(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUseCustomLocation();
                      }
                    }}
                  />
                </div>

                <Button 
                  onClick={handleUseCustomLocation}
                  variant="outline"
                  className="w-full"
                >
                  Buscar en otra ubicación
                </Button>
                <p className="text-xs text-muted-foreground">
                  * Si eliges buscar en otra ubicación, la navegación GPS estará deshabilitada y solo podrás ver propiedades en la dirección ingresada.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Hero;
