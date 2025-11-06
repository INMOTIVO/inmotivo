import { useEffect, useRef } from 'react';

interface UsePlacesAutocompleteProps {
  inputRef: React.RefObject<HTMLInputElement>;
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
  options?: google.maps.places.AutocompleteOptions;
}

export const useGoogleMapsPlaces = ({
  inputRef,
  onPlaceSelected,
  options = {}
}: UsePlacesAutocompleteProps) => {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    // Initialize Autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: 'co' }, // Colombia
        fields: ['geometry', 'name', 'formatted_address', 'place_id'],
        ...options,
      }
    );

    // Add place changed listener
    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (place && place.geometry) {
        onPlaceSelected(place);
      }
    });

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [inputRef, onPlaceSelected, options]);

  return autocompleteRef;
};