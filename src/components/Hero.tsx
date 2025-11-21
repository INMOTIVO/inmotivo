import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import heroImage from "@/assets/hero-medellin.jpg";
import { toast } from "sonner";
import { useInterpretSearch } from "@/hooks/useInterpretSearch";
import VoiceButton from "./VoiceButton";
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
  const [isSearching, setIsSearching] = useState(false);

  // Estados para el campo "Dónde"
  const [searchWhere, setSearchWhere] = useState("");
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string; isCurrentLocation?: boolean } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocationName, setUserLocationName] = useState<string>("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visibleTextRef = useRef<HTMLDivElement>(null);

  const { isLoaded: mapsLoaded } = useGoogleMapsLoader();
  const { predictions, getPredictions } = useGooglePlacesAutocomplete();
  const { interpretSearch, isProcessing: isInterpretingSearch } = useInterpretSearch();
  const { isRecording, isProcessing, audioLevel, partialText, startRecording, stopRecording, cancelRecording } =
    useVoiceRecording();
  const [activeField, setActiveField] = useState<"que" | "donde" | null>(null);
  // Marcar "qué estás buscando" como el primer paso visual
  useEffect(() => {
    setActiveField("que");
  }, []);

  // Auto-adjust textarea height
  const handleSearchInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSearchQuery(e.target.value);

    const ta = e.target;

    // Ajustar altura del textarea real
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 80)}px`;

    // Sincronizar altura del texto visible
    if (visibleTextRef.current) {
      visibleTextRef.current.style.height = ta.style.height;
    }
  };

  // Detectar ubicación automáticamente
  useEffect(() => {
    if (navigator.geolocation) {
      setLoadingLocation(true);
      const timeoutId = setTimeout(() => {
        setLoadingLocation(false);
        console.warn("Timeout al detectar ubicación");
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(timeoutId);
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          console.log("GPS coordinates obtained:", { lat, lng, accuracy: position.coords.accuracy });
          
          setUserLocation({ lat, lng });

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`,
            );
            const data = await response.json();
            
            console.log("Nominatim response:", data);
            
            const address = data.address;
            const municipalityName = address.city || address.town || address.municipality || "";
            const sectorName = address.suburb || address.neighbourhood || "";
            const locationName = sectorName ? `${municipalityName}, ${sectorName}` : municipalityName;
            
            console.log("Location name:", locationName);
            
            setLocation(locationName);
            setUserLocationName(locationName);
          } catch (error) {
            console.error("Error getting location:", error);
            toast.error("No se pudo obtener el nombre de tu ubicación");
          } finally {
            setLoadingLocation(false);
          }
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error("Geolocation error:", error);
          setLoadingLocation(false);
          
          if (error.code === error.PERMISSION_DENIED) {
            toast.error("Debes permitir el acceso a tu ubicación para usar esta función");
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            toast.error("No se pudo determinar tu ubicación. Intenta de nuevo.");
          } else if (error.code === error.TIMEOUT) {
            toast.error("El tiempo de espera se agotó. Intenta de nuevo.");
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  }, []);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".location-suggestions-container")) {
        setShowLocationSuggestions(false);
      }
    };
    if (showLocationSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLocationSuggestions]);

  // Actualizar sugerencias cuando cambie searchWhere
  useEffect(() => {
    if (mapsLoaded && searchWhere.trim()) {
      getPredictions(searchWhere);
    }
  }, [searchWhere, mapsLoaded, getPredictions]);

  const handleWhereInputChange = (value: string) => {
    setSearchWhere(value);
    // Mostrar dropdown siempre que haya foco, incluso si está vacío (para mostrar "Usar mi ubicación actual")
    setShowLocationSuggestions(true);
  };

  const handleUseCurrentLocation = () => {
    if (userLocation && userLocationName) {
      setSelectedLocation({
        lat: userLocation.lat,
        lng: userLocation.lng,
        address: userLocationName,
        isCurrentLocation: true,
      });
      setSearchWhere(userLocationName);
      setShowLocationSuggestions(false);
    } else {
      setLoadingLocation(true);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
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
            const locationName = sectorName 
              ? `${municipalityName}, ${sectorName}` 
              : municipalityName;
            
            setUserLocationName(locationName);
            setLocation(locationName);
            
            setSelectedLocation({ 
              lat, 
              lng, 
              address: locationName, 
              isCurrentLocation: true 
            });
            setSearchWhere(locationName);
            
          } catch (error) {
            console.error("Error getting location name:", error);
            setSelectedLocation({ 
              lat, 
              lng, 
              address: "Tu ubicación actual", 
              isCurrentLocation: true 
            });
            setSearchWhere("Tu ubicación actual");
          } finally {
            setLoadingLocation(false);
            setShowLocationSuggestions(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("No se pudo obtener tu ubicación. Verifica los permisos del navegador.");
          setLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    if (!window.google?.maps) return;
    const service = new window.google.maps.places.PlacesService(document.createElement("div"));
    service.getDetails({ placeId: suggestion.place_id }, (place, status) => {
      if (status === "OK" && place?.geometry?.location) {
        setSelectedLocation({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: suggestion.description,
        });
        setSearchWhere(suggestion.structured_formatting.main_text);
        setShowLocationSuggestions(false);
      }
    });
  };

  const handleGeocodeAddress = async (address: string) => {
    if (!window.google?.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address, componentRestrictions: { country: "CO" } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const location = results[0].geometry.location;
        setSelectedLocation({
          lat: location.lat(),
          lng: location.lng(),
          address: results[0].formatted_address,
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
      setIsSearching(true);

      // 1. Interpretar búsqueda semántica
      const result = await interpretSearch(searchQuery);
      if (!result) {
        setIsSearching(false);
        return;
      }

      // 2. Geocodificar si hay texto en "Dónde" sin selección previa
      if (searchWhere.trim() && !selectedLocation) {
        await handleGeocodeAddress(searchWhere);
      }

      // 3. Preparar datos para el modal
      const searchData: any = {
        query: searchQuery,
        listingType: listingType,
      };

      // Agregar ubicación si existe (prioridad: selectedLocation > userLocation)
      if (selectedLocation) {
        searchData.location = {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          address: selectedLocation.address,
        };
      } else if (userLocation) {
        // Si no seleccionó ubicación, usar la detectada automáticamente
        searchData.location = {
          lat: userLocation.lat,
          lng: userLocation.lng,
          address: userLocationName || "Tu ubicación",
        };
      }

      // Agregar filtros semánticos si existen
      if (result.filters) {
        searchData.semanticFilters = JSON.stringify(result.filters);
      }

      // 4. Navegar a página de selección de modo con state
      navigate("/seleccionar-modo", {
        state: {
          query: searchData.query,
          listingType: searchData.listingType,
          location: searchData.location,
          semanticFilters: searchData.semanticFilters,
          isUsingCurrentLocation: selectedLocation?.isCurrentLocation === true,
        },
      });
    } catch (error) {
      console.error("Error en búsqueda:", error);
      toast.error("Error al procesar la búsqueda");
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error: any) {
      toast.error(error.message || "Error al iniciar grabación");
    }
  };

  const handleStopRecording = async () => {
    try {
      const transcribedText = await stopRecording();
      if (transcribedText) {
        setSearchQuery(transcribedText);
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 80)}px`;
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Error al procesar audio");
    }
  };

  const handleCancelRecording = () => {
    cancelRecording();
  };

  // ⬇️ AGREGA ESTO AQUÍ (ANTES del return)
  useEffect(() => {
    if (activeField === "que") {
      textareaRef.current?.focus();
    }
  }, [activeField]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-visible bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Fondo */}
      <div className="absolute inset-0 w-full h-full">
        <img src={heroImage} alt="Medellín cityscape" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Contenido */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">Encuentra tu lugar ideal</h1>
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
                  : "text-muted-foreground hover:text-foreground",
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
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Comprar
            </button>
          </div>
        </div>

        {/* Contenedor Cápsula de Búsqueda */}
        <div className="relative max-w-5xl mx-auto w-full px-4 sm:px-2">
          {/* Gradiente animado del borde - responsive */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-blue-500 to-primary md:rounded-[28px] rounded-2xl blur-sm opacity-75 animate-pulse" />

          <div className="relative bg-white md:rounded-[28px] rounded-2xl shadow-2xl p-3 md:p-2 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-2">
            {/* Fila 1 Mobile: Qué + Micrófono */}
            <div className="md:flex-1 md:border-r border-gray-200">
              {/* Sección QUÉ */}
              <div
                className={cn(
                  "flex-1 relative px-3 py-2 overflow-visible transition-all " +
                    "rounded-t-2xl rounded-l-2xl md:rounded-l-[28px] md:rounded-r-none",
                  activeField === "que" && "bg-gray-100/70 shadow-inner ring-1 ring-gray-300",
                )}
              >
                <div className="flex flex-col justify-center w-full">
                  <label className="text-xs font-semibold text-gray-700 mb-1">¿Qué estás buscando?</label>

                  {/* --- INPUT AVANZADO --- */}
                  <div className="relative w-full min-h-[28px]">
                    {/* Capa visible (texto + cursor + mic) */}
                    <div
                      ref={visibleTextRef}
                      className="
                    absolute inset-0 whitespace-pre-wrap break-words
                    pl-1 pr-10 text-[12px] md:text-sm leading-[1.4rem]
                    pointer-events-none select-none
                    flex items-center
                  "
                    >
                      {/* TEXTO VISIBLE O PLACEHOLDER */}
                      {searchQuery.trim() || isRecording ? (
                        <>
                          <span>{isRecording ? partialText : searchQuery}</span>

                          {/* CURSOR CUANDO NO ESTÁ GRABANDO */}
                          {!isRecording && activeField === "que" && (
                            <span className="inline-block w-[2px] h-[16px] bg-gray-700 ml-[1px] animate-blink align-text-bottom"></span>
                          )}

                          {/* CURSOR VERDE + MIC CUANDO ESTÁ GRABANDO */}
                          {isRecording && activeField === "que" && (
                            <>
                              <span className="inline-block w-[2px] h-[18px] bg-green-500 ml-[1px] animate-blink align-middle"></span>
                              <span
                                className="
                              inline-flex items-center justify-center ml-1
                              w-5 h-5 rounded-full bg-green-500 shadow-md align-middle
                            "
                              >
                                <Search className="w-3 h-3 text-white" />
                              </span>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-gray-400">Describe la propiedad que buscas</span>

                          {/* CURSOR DESPUÉS DEL PLACEHOLDER */}
                          {activeField === "que" && (
                            <span className="inline-block w-[2px] h-[16px] bg-gray-700 ml-[1px] animate-blink align-text-bottom"></span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Textarea REAL invisible (recibe input) */}
                    <textarea
                      ref={textareaRef}
                      className={`
                  relative z-10 w-full bg-transparent 
                  text-transparent 
                  ${isRecording ? "caret-green-500" : "caret-transparent"}
                  text-[12px] md:text-sm
                  leading-[1.4rem]
                  placeholder:text-gray-400 placeholder-transparent 
                  border-0 resize-none focus-visible:ring-0 
                  outline-none focus:outline-none focus-visible:outline-none
                  p-0 min-h-[28px] max-h-[80px]
                `}
                      value={isRecording ? partialText : searchQuery}
                      onChange={handleSearchInput}
                      onFocus={() => setActiveField("que")}
                      onBlur={() => setActiveField(null)}
                      spellCheck={true}
                      lang="es"
                      autoCorrect="on"
                    />
                  </div>
                </div>

                {/* Botón de micrófono integrado dentro del input */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                  <VoiceButton
                    style="safari"
                    isRecording={isRecording}
                    isProcessing={isProcessing}
                    audioLevel={audioLevel}
                    onStart={handleStartRecording}
                    onStop={handleStopRecording}
                    onCancel={handleCancelRecording}
                  />
                </div>
              </div>
            </div>

            {/* Fila 2: Dónde */}
            <div className="relative w-full md:flex-1">
              <div
                className={cn(
                  "relative px-3 py-2 overflow-visible transition-all rounded-b-2xl rounded-l-2xl",
                  "md:rounded-none md:rounded-r-[28px] md:rounded-l-none",
                  activeField === "donde" && "bg-gray-100/70 shadow-inner ring-1 ring-gray-300",
                )}
              >
                <div className="flex flex-col justify-center w-full">
                  <label className="text-xs font-semibold text-gray-700 mb-1">Dónde</label>

                  {/* INPUT AVANZADO IGUAL A 'QUÉ' */}
                  <div className="relative w-full min-h-[28px]">
                    {/* TEXTO VISIBLE */}
                    <div
                      className="
                    absolute inset-0 whitespace-pre-wrap break-words
                    pl-1 pr-10 text-[12px] md:text-sm leading-[1.4rem]
                    pointer-events-none select-none
                    flex items-center
                  "
                    >
                      {searchWhere.trim() ? (
                        <>
                          <span>{searchWhere}</span>
                          {activeField === "donde" && (
                            <span className="inline-block w-[2px] h-[16px] bg-gray-700 ml-[1px] animate-blink align-text-bottom"></span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-gray-400">¿Dónde lo buscas?</span>
                          {activeField === "donde" && (
                            <span className="inline-block w-[2px] h-[16px] bg-gray-700 ml-[1px] animate-blink align-text-bottom"></span>
                          )}
                        </>
                      )}
                    </div>

                    {/* INPUT REAL (invisible) */}
                    <input
                      type="text"
                      className="
                    absolute inset-0 z-20 w-full h-full opacity-0 cursor-text
                  "
                      value={searchWhere}
                      onChange={(e) => {
                        setSearchWhere(e.target.value);
                        getPredictions(e.target.value);
                        // NO cerrar dropdown automáticamente en onChange
                      }}
                      onFocus={() => {
                        if (!searchQuery.trim()) {
                          toast.error("Primero escribe qué estás buscando");
                          return;
                        }
                        setActiveField("donde");
                        // Siempre mostrar dropdown al enfocar (para permitir "Usar mi ubicación actual")
                        setShowLocationSuggestions(true);
                      }}
                      onBlur={() => setActiveField(null)}
                      spellCheck={true}
                      lang="es"
                      autoCorrect="on"
                    />

                    {/* TEXTAREA FALSA (altura dinámica) */}
                    <textarea
                      className="
                    relative z-10 w-full bg-transparent text-transparent
                    text-[12px] md:text-sm
                    border-0 resize-none focus-visible:ring-0 p-0
                    min-h-[28px] max-h-[80px]
                  "
                      value={searchWhere}
                      readOnly
                      ref={(t) => {
                        if (t) {
                          t.style.height = "auto";
                          t.style.height = `${Math.min(t.scrollHeight, 80)}px`;
                        }
                      }}
                    />

                    {/* DROPDOWN */}
                    {showLocationSuggestions && (
                      <div
                        className="
                      absolute left-0 right-0 mt-2 z-[200]
                      bg-white rounded-xl shadow-2xl border border-gray-200
                      max-h-80 overflow-y-auto
                      location-suggestions-container
                    "
                      >
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevenir que el input pierda el foco
                            handleUseCurrentLocation();
                          }}
                          className="flex items-center gap-3 p-3 cursor-pointer border-b bg-green-50 hover:bg-green-100"
                        >
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-700">Usar mi ubicación actual</span>
                        </div>

                        {predictions.map((s) => (
                          <div
                            key={s.place_id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectSuggestion(s);
                            }}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                          >
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{s.structured_formatting.main_text}</div>
                              <div className="text-sm text-gray-500 truncate">
                                {s.structured_formatting.secondary_text}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón Buscar */}
              {/* Botón Buscar — cambia según el dispositivo */}

              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isInterpretingSearch || isProcessing}
                className="
              hidden md:flex
              absolute right-3 top-1/2 -translate-y-1/2
              w-14 h-14 md:rounded-[28px] bg-primary text-white
              shadow-lg hover:shadow-xl items-center justify-center
              transition z-50
            "
              >
                {isInterpretingSearch ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              </button>

              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isInterpretingSearch || isProcessing}
                className="
              md:hidden
              mt-4 w-full py-2.5
              bg-primary text-white font-semibold
              rounded-full                       /* ⬅ borde redondeado */
              shadow-md hover:shadow-lg
              flex items-center justify-center
              gap-2 text-sm
              transition-all active:scale-95
            "
              >
                {isInterpretingSearch ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Buscar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tu ubicación actual */}
        {location && !loadingLocation && (
          <div className="mt-4 text-center text-white/80 text-sm flex items-center justify-center gap-2">
            <span>
              Tu ubicación: <span className="font-medium">{location}</span>
            </span>
            <button
              onClick={() => {
                setLoadingLocation(true);
                navigator.geolocation.getCurrentPosition(
                  async (position) => {
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
                      const locationName = sectorName 
                        ? `${municipalityName}, ${sectorName}` 
                        : municipalityName;
                      
                      setLocation(locationName);
                      setUserLocationName(locationName);
                      toast.success("Ubicación actualizada");
                    } catch (error) {
                      console.error("Error:", error);
                      toast.error("Error al actualizar ubicación");
                    } finally {
                      setLoadingLocation(false);
                    }
                  },
                  (error) => {
                    console.error("Error:", error);
                    toast.error("No se pudo actualizar tu ubicación");
                    setLoadingLocation(false);
                  },
                  { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
              }}
              className="text-white/60 hover:text-white transition-colors"
              title="Actualizar ubicación"
            >
              🔄
            </button>
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
