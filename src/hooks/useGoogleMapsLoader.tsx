import { useEffect, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

// Configuración centralizada de Google Maps
// IMPORTANTE: NUNCA modificar estas opciones sin actualizar todos los componentes
// Nota: Cargamos solo 'maps' para evitar conflictos por HMR. Luego importamos 'places' dinámicamente.
const GOOGLE_MAPS_LIBRARIES: ("places" | "drawing" | "geometry" | "visualization" | "maps")[] = ['maps'];

export const useGoogleMapsLoader = () => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [placesReady, setPlacesReady] = useState(false);

  useEffect(() => {
    const ensurePlaces = async () => {
      if (!isLoaded || !(window as any).google?.maps) return;
      // Si ya existe, marcar como listo
      if ((window as any).google.maps.places) {
        setPlacesReady(true);
        return;
      }
      // Intentar importar dinámicamente la librería 'places' (Maps JS admite importLibrary)
      try {
        // @ts-ignore - importLibrary existe en la API JS moderna
        await (window as any).google.maps.importLibrary?.('places');
      } catch (e) {
        // Si falla por cualquier motivo, continuar; los componentes deben manejar la falta de Places
        console.warn('No se pudo cargar la librería Places dinámicamente:', e);
      } finally {
        setPlacesReady(!!(window as any).google?.maps?.places);
      }
    };
    ensurePlaces();
  }, [isLoaded]);

  return { isLoaded: isLoaded && placesReady };
};
