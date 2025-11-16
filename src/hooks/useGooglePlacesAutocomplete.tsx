import { useState, useCallback, useEffect } from 'react';
import { useGoogleMapsLoader } from './useGoogleMapsLoader';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export const useGooglePlacesAutocomplete = () => {
  const { isLoaded } = useGoogleMapsLoader();
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);

  const getPredictions = useCallback(
    async (input: string) => {
      if (!isLoaded || !input.trim() || !window.google?.maps?.places) {
        setPredictions([]);
        return;
      }

      setLoading(true);
      
      try {
        const service = new google.maps.places.AutocompleteService();
        
        service.getPlacePredictions(
          {
            input: input.trim(),
            componentRestrictions: { country: 'co' }, // Solo Colombia
            types: ['geocode', 'establishment'], // Lugares, ciudades, direcciones
          },
          (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              setPredictions(results as PlacePrediction[]);
            } else {
              setPredictions([]);
            }
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error getting predictions:', error);
        setPredictions([]);
        setLoading(false);
      }
    },
    [isLoaded]
  );

  // Debounce the predictions
  useEffect(() => {
    const timer = setTimeout(() => {
      // This effect is just for cleanup, actual debouncing is handled in the component
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return {
    predictions,
    loading,
    getPredictions,
  };
};
