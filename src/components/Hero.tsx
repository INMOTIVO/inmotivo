import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, MapPin, Loader2, ArrowLeft, Check, ChevronsUpDown, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import heroImage from "@/assets/hero-medellin.jpg";
import { toast } from "sonner";
import SearchOptions from './SearchOptions';
import { useIsMobile } from "@/hooks/use-mobile";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useInterpretSearch } from "@/hooks/useInterpretSearch";
import VoiceButton from './VoiceButton';
import { getDepartments, getMunicipalitiesByDepartment, getNeighborhoodsByMunicipality } from '@/data/colombiaLocations';
import { cn } from "@/lib/utils";
const Hero = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [listingType, setListingType] = useState<"rent" | "sale">("rent");
  const [location, setLocation] = useState("");
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
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([]);
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>([]);
  const [openDept, setOpenDept] = useState(false);
  const [openMuni, setOpenMuni] = useState(false);
  const [openNeigh, setOpenNeigh] = useState(false);
  const [showLocationConfirmDialog, setShowLocationConfirmDialog] = useState(false);
  const [pendingSearchQuery, setPendingSearchQuery] = useState("");
  const [useGPSForSearch, setUseGPSForSearch] = useState(false);
  const [extractedFilters, setExtractedFilters] = useState<any>(null);
  const [showMicPermissionDialog, setShowMicPermissionDialog] = useState(false);
  const isMobile = useIsMobile();
  const {
    interpretSearch,
    isProcessing: isInterpretingSearch
  } = useInterpretSearch();
  const {
    isRecording,
    isProcessing,
    audioLevel,
    partialText,
    micPermission,
    requestMicrophonePermission,
    startRecording,
    stopRecording,
    cancelRecording
  } = useVoiceRecording();

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
        setMunicipality("");
        setLocation("");
        return;
      }
      setLoadingLocation(true);

      // Timeout para la detección de ubicación
      const timeoutId = setTimeout(() => {
        setLoadingLocation(false);
        setMunicipality("");
        setLocation("");
        toast.error("Tiempo agotado. Usando ubicación por defecto", {
          description: "Puedes cambiarla haciendo clic en tu ubicación"
        });
      }, 8000); // 8 segundos timeout

      navigator.geolocation.getCurrentPosition(async position => {
        clearTimeout(timeoutId);
        const {
          latitude,
          longitude
        } = position.coords;
        try {
          // Use Nominatim API with timeout
          const controller = new AbortController();
          const fetchTimeout = setTimeout(() => controller.abort(), 5000);
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`, {
            headers: {
              'Accept-Language': 'es'
            },
            signal: controller.signal
          });
          clearTimeout(fetchTimeout);
          if (!response.ok) throw new Error("Error al obtener la ubicación");
          const data = await response.json();
          const address = data.address;

          // Extract municipality and sector
          const municipalityName = address.city || address.town || address.municipality || address.county || "";
          const sectorName = address.suburb || address.neighbourhood || address.quarter || address.village || "";
          setMunicipality(municipalityName);
          setSector(sectorName);
          setLocation(sectorName ? `${municipalityName}, ${sectorName}` : municipalityName);
        } catch (error) {
          console.error("Error getting location:", error);
          // Usar ubicación por defecto en caso de error

        } finally {
          setLoadingLocation(false);
        }
      }, error => {
        clearTimeout(timeoutId);
        console.error("Geolocation error:", error);
        setLoadingLocation(false);


      }, {
        enableHighAccuracy: true,
        timeout: 7000,
        // 7 segundos para GPS
        maximumAge: 0
      });
    };
    getCurrentLocation();
  }, []);
  const handleStartVoiceRecording = async () => {
    // Si el permiso no ha sido otorgado, mostrar diálogo
    if (micPermission === 'prompt') {
      setShowMicPermissionDialog(true);
      return;
    }

    if (micPermission === 'denied') {
      toast.error('Permiso de micrófono denegado', {
        description: 'Por favor permite el acceso al micrófono en la configuración de tu navegador'
      });
      return;
    }

    try {
      await startRecording();
    } catch (error: any) {
      console.error('Error starting voice recording:', error);
      toast.error('Error al iniciar grabación');
    }
  };

  const handleGrantMicPermission = async () => {
    const granted = await requestMicrophonePermission();
    setShowMicPermissionDialog(false);
    
    if (granted) {
      // Iniciar grabación inmediatamente después de otorgar permiso
      try {
        await startRecording();
      } catch (error: any) {
        console.error('Error starting voice recording:', error);
        toast.error('Error al iniciar grabación');
      }
    }
  };

  const handleStopVoiceRecording = async () => {
    try {
      const transcript = await stopRecording();
      console.log('[Voz] Transcripción:', transcript);
      
      if (transcript && transcript.trim().length > 0) {
        setSearchQuery(transcript);
        toast.success('Listo');
      } else {
        toast.error('No se detectó audio');
      }
    } catch (error: any) {
      console.error('[Voz] Error:', error);
      if (error.message !== 'Cancelled by user' && error.message !== 'No hay grabación activa') {
        toast.error('Intenta de nuevo');
      }
    }
  };
  

  const handleCancelVoiceRecording = () => {
    cancelRecording();
  };
  const handleSearch = async (queryText?: string) => {
    const textToSearch = queryText || searchQuery;

    if (!textToSearch.trim()) {
      toast.error("Por favor describe qué buscas");
      return;
    }

    // Interpretar búsqueda
    const result = await interpretSearch(textToSearch);
    if (!result) return;

    setExtractedFilters(result);

    // Detectar ubicación desde cualquier parte
    const extractedLocation =
      result.location ||
      result?.filters?.location ||
      result?.parsed?.location ||
      result?.locationText ||
      null;

    // 🟢 1. Si la IA detecta ubicación → NO mostrar modal
    if (extractedLocation) {
      setUseGPSForSearch(false); 
      setShowOptions(true);
      return;
    }

    // 🔴 2. Si la IA NO detectó ubicación → mostrar modal
    setPendingSearchQuery(textToSearch);
    setShowLocationConfirmDialog(true);
  };




  const handleContinueWithCurrentLocation = async () => {
    setShowLocationConfirmDialog(false);
    setUseGPSForSearch(true); // Activar GPS para esta búsqueda

    // Usar el hook optimizado con caché
    const result = await interpretSearch(pendingSearchQuery);
    if (!result) return; // El hook ya maneja los errores

    // Guardar los filtros extraídos
    setExtractedFilters(result);

    // Mostrar opciones de búsqueda
    setShowOptions(true);
  };
  const handleChangeLocationForSearch = () => {
    setShowLocationConfirmDialog(false);
    setUseGPSForSearch(false); // Desactivar GPS, buscar por texto

    // Interpretar la búsqueda para extraer ubicación
    const interpretAndShow = async () => {
      const result = await interpretSearch(pendingSearchQuery);
      if (!result) return;
      setExtractedFilters(result);
      setShowLocationDialog(true);
    };
    interpretAndShow();
  };
  const handleContinueCurrentLocation = () => {
    setUseCustomLocation(false);
    setShowLocationDialog(false);
    toast.success("Usando tu ubicación actual");
  };
  const handleDepartmentChange = (value: string) => {
    setCustomDepartment(value);
    setCustomMunicipality("");
    setCustomNeighborhood("");
    const municipalities = getMunicipalitiesByDepartment(value);
    setAvailableMunicipalities(municipalities);
    setAvailableNeighborhoods([]);
  };
  const handleMunicipalityChange = (value: string) => {
    setCustomMunicipality(value);
    setCustomNeighborhood("");
    const neighborhoods = getNeighborhoodsByMunicipality(customDepartment, value);
    setAvailableNeighborhoods(neighborhoods);
  };
  const handleUseCustomLocation = async () => {
    if (!customDepartment.trim()) {
      toast.error("El departamento es obligatorio");
      return;
    }
    if (!customMunicipality.trim()) {
      toast.error("El municipio es obligatorio");
      return;
    }
    setUseCustomLocation(true);
    const fullLocation = customNeighborhood.trim() ? `${customMunicipality}, ${customNeighborhood}` : customMunicipality;
    setMunicipality(customMunicipality);
    setSector(customNeighborhood);
    setShowLocationDialog(false);
    toast.success(`Buscando en: ${customDepartment}, ${fullLocation}`);

    // Si hay una búsqueda pendiente, ejecutarla con la nueva ubicación
    if (pendingSearchQuery.trim()) {
      const result = await interpretSearch(pendingSearchQuery);
      if (result) {
        setShowOptions(true);
      }
    }
  };
  if (showOptions) {
    return <section className="fixed inset-0 top-14 md:top-16 flex flex-col overflow-hidden z-50">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center" style={{
          backgroundImage: `url(${heroImage})`
        }}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/50 via-primary/40 to-blue-600/50" />
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 pt-2">
          <Button variant="default" size="icon" onClick={() => setShowOptions(false)} className="rounded-full w-12 h-12 shadow-xl bg-primary hover:bg-primary/90">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-4 flex-1 flex items-center justify-center overflow-hidden">
          <SearchOptions 
            searchQuery={searchQuery} 
            municipality={municipality || ""} 
            sector={sector} 
            listingType={listingType}
            onSearchChange={newQuery => setSearchQuery(newQuery)} 
            disableGPSNavigation={useCustomLocation} 
            useGPSForFixedView={useGPSForSearch} 
            searchLocation={
              useGPSForSearch
                ? null        // cuando usa GPS → SearchOptions usa la posición real
                : extractedFilters?.location
}

          />
        </div>
      </section>;
  }
  return <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image with gradient overlay */}
        <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url(${heroImage})`
      }}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/50 via-primary/40 to-blue-600/50" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-8 md:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4 animate-fade-in -mt-8">
              <h1 className="text-3xl sm:text-4xl md:text-7xl font-bold text-white leading-tight">
                Encuentra tu <span className="text-primary-glow">lugar ideal</span> de manera <span className="text-accent">inteligente</span>
              </h1>
              <p className="text-base sm:text-lg md:text-2xl text-white/90 max-w-3xl mx-auto px-4">Descubre propiedades cerca a ti mientras recorres la ciudad.</p>
            </div>

            {/* Search bar */}
            <div className="relative max-w-2xl mx-auto w-full px-4 sm:px-2">
              {/* Animated border glow */}
              <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[gradient-flow_3s_linear_infinite] opacity-75 blur-sm"></div>
              
              <div className="relative bg-white rounded-xl md:rounded-2xl shadow-2xl p-3 md:p-4">
                <div className="space-y-2 md:space-y-3">
                  {/* Listing Type Selector - PRIMERO */}
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-lg border border-border bg-muted p-1 w-full">
                      <button
                        type="button"
                        onClick={() => setListingType("rent")}
                        className={cn(
                          "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all border-2",
                          listingType === "rent"
                            ? "bg-background text-foreground shadow-sm border-yellow-400"
                            : "text-muted-foreground hover:text-foreground border-transparent"
                        )}
                      >
                        Arrendar
                      </button>
                      <button
                        type="button"
                        onClick={() => setListingType("sale")}
                        className={cn(
                          "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all border-2",
                          listingType === "sale"
                            ? "bg-background text-foreground shadow-sm border-yellow-400"
                            : "text-muted-foreground hover:text-foreground border-transparent"
                        )}
                      >
                        Comprar
                      </button>
                    </div>
                  </div>

{/* Descripción - SEGUNDO */}
<div className="flex items-start gap-2 border border-border rounded-lg p-2 relative">
  {/* Ícono de búsqueda */}
  <Search
    className={cn(
      "h-4 w-4 mt-2 flex-shrink-0 transition-colors",
      isRecording ? "text-primary animate-pulse" : "text-muted-foreground"
    )}
  />

  {/* Campo de texto con escritura en vivo */}
  <Textarea
    placeholder="Describe la propiedad que buscas"
    className="border-0 focus-visible:ring-0 text-base md:text-sm leading-normal resize-none min-h-[44px] max-h-[96px] md:max-h-[120px] w-full overflow-y-auto"
    value={isRecording ? partialText : searchQuery} // 👈 muestra palabras en tiempo real
    onChange={(e) => setSearchQuery(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSearch();
      }
    }}
  />


</div>


                  {/* Botón Buscar - TERCERO */}
                  <div className="flex items-center gap-2 w-full">
                  <Button
                    variant="hero"
                    size="lg"
                    onClick={() => handleSearch()}
                    disabled={
                      !searchQuery.trim() ||
                      isRecording ||
                      isProcessing ||
                      isInterpretingSearch ||
                      loadingLocation
                    }
                    className="flex-1 min-w-[120px] text-base font-semibold transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isInterpretingSearch ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Buscar"
                    )}
                  </Button>

                    <VoiceButton isRecording={isRecording} isProcessing={isProcessing} audioLevel={audioLevel} onStart={handleStartVoiceRecording} onStop={handleStopVoiceRecording} onCancel={handleCancelVoiceRecording} disabled={loadingLocation || isInterpretingSearch} />
                  </div>

                  {/* Tu ubicación - CUARTO */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t">
                    {loadingLocation ? <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                        <span className="text-xs text-muted-foreground">Detectando ubicación...</span>
                      </div> : <div className="flex items-center gap-1.5 justify-center">
                        <MapPin className="h-4 w-4 text-primary animate-bounce flex-shrink-0" />
                        <span className="text-sm font-medium">Tu ubicación:</span>
                        {municipality && sector ? <span className="text-sm font-medium truncate">{municipality}, {sector}</span> : municipality ? <span className="text-sm font-medium truncate">{municipality}</span> : <span className="text-sm font-medium truncate"></span>}
                      </div>}
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
      {isMobile && showFixedSearch && <div className="fixed bottom-6 left-0 right-0 z-50 bg-white shadow-2xl border-t border-border/50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input placeholder="¿Qué buscas?" className="flex-1 border-input text-base leading-normal min-h-[44px] shadow-lg border-2" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }} disabled={isRecording || isProcessing || isInterpretingSearch} />
              <VoiceButton isRecording={isRecording} isProcessing={isProcessing} audioLevel={audioLevel} onStart={handleStartVoiceRecording} onStop={handleStopVoiceRecording} onCancel={handleCancelVoiceRecording} size="icon" variant="outline" disabled={isInterpretingSearch} />
              <Button variant="hero" size="sm" onClick={() => handleSearch()} disabled={!searchQuery.trim() || isRecording || isProcessing || isInterpretingSearch} className="flex-shrink-0">
                {isInterpretingSearch ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
              </Button>
            </div>
            <div className="inline-flex rounded-lg border border-border bg-muted p-1 w-full">
              <button
                type="button"
                onClick={() => setListingType("rent")}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all border-2",
                  listingType === "rent"
                    ? "bg-background text-foreground shadow-sm border-yellow-400"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                )}
              >
                Arrendar
              </button>
              <button
                type="button"
                onClick={() => setListingType("sale")}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all border-2",
                  listingType === "sale"
                    ? "bg-background text-foreground shadow-sm border-yellow-400"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                )}
              >
                Comprar
              </button>
            </div>
          </div>
        </div>}

      {/* Location Confirmation Dialog */}
      <Dialog open={showLocationConfirmDialog} onOpenChange={setShowLocationConfirmDialog}>
    <DialogContent
      className="
        w-[96vw]               /* ocupa casi todo el ancho en pantallas muy pequeñas */
        max-w-[480px] sm:max-w-[600px] md:max-w-[720px] lg:max-w-[800px]
        px-3 sm:px-6 md:px-8
        py-3 sm:py-5
        rounded-2xl
        overflow-hidden
      "
    >
      <DialogHeader className="text-center space-y-2">
        <DialogTitle
          className="
            text-base [@media(max-width:340px)]:text-sm  /* más pequeño en pantallas menores a 340px */
            sm:text-lg font-semibold leading-tight break-words
          "
        >
          Confirmar ubicación de búsqueda
        </DialogTitle>

        <DialogDescription
          className="
            text-[11px] [@media(max-width:340px)]:text-[10px]  /* reduce fuente en pantallas muy angostas */
            sm:text-sm md:text-base text-muted-foreground
            leading-relaxed break-words text-balance
            mx-auto max-w-[92%] sm:max-w-[85%]
          "
        >
          Estás usando tu ubicación en tiempo real para buscar propiedades.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-3">
        <div className="flex items-center gap-2 px-2 sm:px-3 py-2 bg-primary/5 rounded-md border border-primary/20">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <p className="text-[11px] sm:text-sm text-muted-foreground truncate">
            <span className="text-foreground">
              {municipality}
              {sector && `, ${sector}`}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:gap-3">
          <Button
            onClick={handleContinueWithCurrentLocation}
            variant="default"
            className="w-full text-[12px] sm:text-sm md:text-base py-2 sm:py-3"
          >
            <MapPin className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Continuar con mi ubicación actual
          </Button>

          <Button
            onClick={handleChangeLocationForSearch}
            variant="outline"
            className="w-full text-[12px] sm:text-sm md:text-base py-2 sm:py-3"
          >
            <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Buscar en otra ubicación
          </Button>
        </div>
      </div>
    </DialogContent>
      </Dialog>

      {/* Microphone Permission Dialog */}
      <Dialog open={showMicPermissionDialog} onOpenChange={setShowMicPermissionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              Permiso para usar el micrófono
            </DialogTitle>
            <DialogDescription className="text-left space-y-2 pt-2">
              <p>Para buscar propiedades usando tu voz, necesitamos acceso al micrófono.</p>
              <p className="text-sm">Tu voz no será almacenada ni compartida. Solo se usa para transcribir tu búsqueda.</p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={handleGrantMicPermission} variant="default" className="w-full">
              <Mic className="mr-2 h-4 w-4" />
              Permitir acceso al micrófono
            </Button>
            <Button onClick={() => setShowMicPermissionDialog(false)} variant="outline" className="w-full">
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
              <Button onClick={handleContinueCurrentLocation} variant="default" className="w-full">
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
                  <Popover open={openDept} onOpenChange={setOpenDept}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openDept} className="w-full justify-between bg-background">
                        {customDepartment || "Selecciona un departamento"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-popover" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar departamento..." />
                        <CommandList>
                          <CommandEmpty>No se encontró departamento.</CommandEmpty>
                          <CommandGroup>
                            {getDepartments().map(dept => <CommandItem key={dept} value={dept} onSelect={value => {
                            handleDepartmentChange(value);
                            setOpenDept(false);
                          }}>
                                <Check className={cn("mr-2 h-4 w-4", customDepartment === dept ? "opacity-100" : "opacity-0")} />
                                {dept}
                              </CommandItem>)}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Municipio <span className="text-destructive">*</span>
                  </label>
                  <Popover open={openMuni} onOpenChange={setOpenMuni}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openMuni} disabled={!customDepartment} className="w-full justify-between bg-background">
                        {customMunicipality || (customDepartment ? "Selecciona un municipio" : "Primero selecciona un departamento")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-popover" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar municipio..." />
                        <CommandList>
                          <CommandEmpty>No se encontró municipio.</CommandEmpty>
                          <CommandGroup>
                            {availableMunicipalities.map(muni => <CommandItem key={muni} value={muni} onSelect={value => {
                            handleMunicipalityChange(value);
                            setOpenMuni(false);
                          }}>
                                <Check className={cn("mr-2 h-4 w-4", customMunicipality === muni ? "opacity-100" : "opacity-0")} />
                                {muni}
                              </CommandItem>)}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Localidad o Barrio <span className="text-muted-foreground text-xs">(opcional)</span>
                  </label>
                  <Popover open={openNeigh} onOpenChange={setOpenNeigh}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openNeigh} disabled={!customMunicipality} className="w-full justify-between bg-background">
                        {customNeighborhood || (customMunicipality ? "Selecciona un barrio (opcional)" : "Primero selecciona un municipio")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-popover" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar barrio..." />
                        <CommandList>
                          <CommandEmpty>No se encontró barrio.</CommandEmpty>
                          <CommandGroup>
                            {availableNeighborhoods.map(neighborhood => <CommandItem key={neighborhood} value={neighborhood} onSelect={value => {
                            setCustomNeighborhood(value);
                            setOpenNeigh(false);
                          }}>
                                <Check className={cn("mr-2 h-4 w-4", customNeighborhood === neighborhood ? "opacity-100" : "opacity-0")} />
                                {neighborhood}
                              </CommandItem>)}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <Button 
                  onClick={handleUseCustomLocation} 
                  variant={customMunicipality ? "default" : "outline"} 
                  className={cn(
                    "w-full transition-all duration-300",
                    customMunicipality && "border-2 border-yellow-400"
                  )}
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
    </>;
};
export default Hero;