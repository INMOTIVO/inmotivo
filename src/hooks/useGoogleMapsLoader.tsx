import { useJsApiLoader } from '@react-google-maps/api';

// Configuración centralizada de Google Maps
// IMPORTANTE: NUNCA modificar estas opciones sin actualizar todos los componentes
const GOOGLE_MAPS_LIBRARIES: ("places" | "drawing" | "geometry" | "visualization" | "maps")[] = ['maps', 'places'];

export const useGoogleMapsLoader = () => {
  return useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
};
