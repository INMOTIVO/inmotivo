import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import heroImage from "@/assets/hero-medellin.jpg";
import { toast } from "sonner";
import { useInterpretSearch } from "@/hooks/useInterpretSearch";
import VoiceButton from './VoiceButton';
import { cn } from "@/lib/utils";
import { useGooglePlacesAutocomplete } from "@/hooks/useGooglePlacesAutocomplete";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";

const Hero = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [listingType, setListingType] = useState<"rent" | "sale">("rent");
  const [location, setLocation] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // Estados para el campo "Dónde"
  const [searchWhere, setSearchWhere] = useState("");
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { isLoaded: mapsLoaded } = useGoogleMapsLoader();
  const { predictions, getPredictions } = useGooglePlacesAutocomplete();
  const { interpretSearch, isProcessing: isInterpretingSearch } = useInterpretSearch();
  const {
    isRecording,
    isProcessing,
    audioLevel,
    partialText,
    startRecording,
    stopRecording,
    cancelRecording
  } = useVoiceRecording();

  // Auto-adjust textarea height
  const handleSearchInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSearchQuery(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 80)}px`;
  };

  // Detectar ubicación automáticamente
  useEffect(() => {
    if (navigator.geolocation) {
      setLoadingLocation(true);
      const timeoutId = setTimeout(() => setLoadingLocation(false), 7000);

      navigator.geolocation.getCurrentPosition(async (position) => {
        clearTimeout(timeoutId);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation({ lat, lng });

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`
          );
          const data = await response.json();
          const address = data.address;
          const municipalityName = address.city || address.town || address.municipality || "";
          const sectorName = address.suburb || address.neighbourhood || "";
          setLocation(sectorName ? `${municipalityName}, ${sectorName}` : municipalityName);
        } catch (error) {
          console.error("Error getting location:", error);
        } finally {
          setLoadingLocation(false);
        }
      }, () => {
        clearTimeout(timeoutId);
        setLoadingLocation(false);
      });
    }
  }, []);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.location-suggestions-container')) {
        setShowLocationSuggestions(false);
      }
    };
    if (showLocationSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLocationSuggestions]);

  // Actualizar sugerencias cuando cambie searchWhere
  useEffect(() => {
    if (mapsLoaded && searchWhere.trim()) {
      getPredictions(searchWhere);
    }
  }, [searchWhere, mapsLoaded, getPredictions]);

  const handleWhereInputChange = (value: string) => {
    setSearchWhere(value);
    if (value.trim()) {
      setShowLocationSuggestions(true);
    } else {
      setShowLocationSuggestions(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (userLocation) {
      setSelectedLocation({
        lat: userLocation.lat,
        lng: userLocation.lng,
        address: "Tu ubicación actual"
      });
      setSearchWhere("Tu ubicación actual");
      setShowLocationSuggestions(false);
    } else {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation({ lat, lng });
        setSelectedLocation({ lat, lng, address: "Tu ubicación actual" });
        setSearchWhere("Tu ubicación actual");
        setShowLocationSuggestions(false);
      }, () => {
        toast.error("No se pudo obtener tu ubicación");
      });
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    if (!window.google?.maps) return;
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    service.getDetails({ placeId: suggestion.place_id }, (place, status) => {
      if (status === 'OK' && place?.geometry?.location) {
        setSelectedLocation({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: suggestion.description
        });
        setSearchWhere(suggestion.structured_formatting.main_text);
        setShowLocationSuggestions(false);
      }
    });
  };

  const handleGeocodeAddress = async (address: string) => {
    if (!window.google?.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address, componentRestrictions: { country: 'CO' } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const location = results[0].geometry.location;
        setSelectedLocation({
          lat: location.lat(),
          lng: location.lng(),
          address: results[0].formatted_address
        });
      }
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Por favor describe qué buscas");
      return;
    }

    try {
      const result = await interpretSearch(searchQuery);
      if (!result) return;

      if (searchWhere.trim() && !selectedLocation) {
        await handleGeocodeAddress(searchWhere);
      }

      const params = new URLSearchParams({
        query: searchQuery,
        listingType: listingType,
      });

      if (selectedLocation) {
        params.append('lat', selectedLocation.lat.toString());
        params.append('lng', selectedLocation.lng.toString());
        params.append('location', selectedLocation.address);
      }

      if (result.filters) {
        params.append('semanticFilters', JSON.stringify(result.filters));
      }

      navigate(`/properties-catalog?${params.toString()}`);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      toast.error('Error al procesar la búsqueda');
    }
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar grabación');
    }
  };

  const handleStopRecording = async () => {
    try {
      const transcribedText = await stopRecording();
      if (transcribedText) {
        setSearchQuery(transcribedText);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 80)}px`;
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar audio');
    }
  };

  const handleCancelRecording = () => {
    cancelRecording();
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Fondo */}
      <div className="absolute inset-0 w-full h-full">
        <img src={heroImage} alt="Medellín cityscape" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Contenido */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Encuentra tu lugar ideal
          </h1>
          <p className="text-lg md:text-xl text-white/90 drop-shadow-md">
            Busca propiedades en arriendo o venta de forma inteligente
          </p>
        </div>

        {/* Tabs de Arrendar/Comprar - FUERA del contenedor */}
        <div className="mb-4 flex justify-center">
          <div className="inline-flex rounded-lg border border-border bg-white/90 backdrop-blur-sm p-1">
            <button
              type="button"
              onClick={() => setListingType("rent")}
              className={cn(
                "rounded-md px-6 py-2 text-sm font-medium transition-all",
                listingType === "rent"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Arrendar
            </button>
            <button
              type="button"
              onClick={() => setListingType("sale")}
              className={cn(
                "rounded-md px-6 py-2 text-sm font-medium transition-all",
                listingType === "sale"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Comprar
            </button>
          </div>
        </div>

        {/* Contenedor Cápsula de Búsqueda */}
        <div className="relative max-w-5xl mx-auto w-full px-4 sm:px-2">
          {/* Gradiente animado del borde - responsive */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-blue-500 to-primary md:rounded-full rounded-2xl blur-sm opacity-75 animate-pulse" />
          
          <div className="relative bg-white md:rounded-full rounded-2xl shadow-2xl p-3 md:p-2 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-2">
            {/* Fila 1 Mobile: Qué + Micrófono */}
            <div className="flex items-center gap-2 md:flex-1 md:border-r border-gray-200">
              {/* Sección QUÉ */}
              <div className="flex-1 flex items-center gap-2 px-3 py-2">
                <div className="flex flex-col justify-center w-full">
                  <label className="text-xs font-semibold text-gray-700 mb-1">Qué</label>
                  <Textarea
                    ref={textareaRef}
                    placeholder="Describe la propiedad que buscas"
                    className="border-0 focus-visible:ring-0 resize-none text-sm w-full p-0 min-h-[24px] max-h-[80px] overflow-y-auto"
                    value={isRecording ? partialText : searchQuery}
                    onChange={handleSearchInput}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    rows={1}
                  />
                </div>
              </div>

              {/* BOTÓN MICRÓFONO - visible en mobile en esta posición */}
              <div className="flex md:hidden px-2">
                <VoiceButton
                  isRecording={isRecording}
                  isProcessing={isProcessing}
                  audioLevel={audioLevel}
                  onStart={handleStartRecording}
                  onStop={handleStopRecording}
                  onCancel={handleCancelRecording}
                />
              </div>
            </div>

            {/* Separador vertical solo desktop */}
            <div className="hidden md:block h-12 w-px bg-gray-200 mx-2" />

            {/* BOTÓN MICRÓFONO solo desktop */}
            <div className="hidden md:flex items-center justify-center px-2">
              <VoiceButton
                isRecording={isRecording}
                isProcessing={isProcessing}
                audioLevel={audioLevel}
                onStart={handleStartRecording}
                onStop={handleStopRecording}
                onCancel={handleCancelRecording}
              />
            </div>

            {/* Separador horizontal mobile */}
            <div className="md:hidden h-px w-full bg-gray-200" />

            {/* Separador vertical solo desktop */}
            <div className="hidden md:block h-12 w-px bg-gray-200 mx-2" />

            {/* Fila 2 Mobile: Dónde + Buscar */}
            <div className="flex items-center gap-2 md:flex-1">
              {/* Sección DÓNDE */}
              <div className="flex-1 flex items-center gap-2 px-3 py-2 relative location-suggestions-container">
                <div className="flex flex-col justify-center w-full">
                  <label className="text-xs font-semibold text-gray-700 mb-1">Dónde</label>
                  <Input
                    placeholder="¿En dónde?"
                    className="border-0 focus-visible:ring-0 text-sm w-full p-0 h-6"
                    value={searchWhere}
                    onChange={(e) => handleWhereInputChange(e.target.value)}
                    onFocus={() => setShowLocationSuggestions(searchWhere.trim().length > 0 && predictions.length > 0)}
                  />
                </div>

                {/* Dropdown de sugerencias */}
                {showLocationSuggestions && (predictions.length > 0 || searchWhere.trim()) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[100] overflow-hidden max-h-80 overflow-y-auto">
                    {/* Primera opción: Usar mi ubicación */}
                    <div 
                      onClick={handleUseCurrentLocation}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b transition-colors"
                    >
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="font-medium">📍 Usar mi ubicación actual</div>
                    </div>

                    {/* Sugerencias de Google */}
                    {predictions.length > 0 ? (
                      predictions.map((suggestion) => (
                        <div
                          key={suggestion.place_id}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{suggestion.structured_formatting.main_text}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {suggestion.structured_formatting.secondary_text}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : searchWhere.trim() && (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        Escribe para buscar lugares
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Separador vertical solo desktop */}
              <div className="hidden md:block h-12 w-px bg-gray-200 mx-2" />

              {/* BOTÓN BUSCAR - CIRCULAR CON SOLO ÍCONO */}
              <Button 
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isInterpretingSearch || isProcessing}
                className="rounded-full w-14 h-14 p-0 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow shrink-0"
                size="icon"
              >
                {isInterpretingSearch ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Tu ubicación actual */}
        {location && !loadingLocation && (
          <div className="mt-4 text-center text-white/80 text-sm">
            Tu ubicación: <span className="font-medium">{location}</span>
          </div>
        )}

        {loadingLocation && (
          <div className="mt-4 text-center text-white/80 text-sm flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Detectando ubicación...
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;
