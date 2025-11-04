// Helper functions for map navigation

export const radiusFromBounds = (bounds: google.maps.LatLngBounds): number => {
  const center = bounds.getCenter();
  const ne = bounds.getNorthEast();
  
  // Calculate distance from center to corner using Haversine
  const R = 6371e3; // Earth's radius in meters
  const lat1 = center.lat() * Math.PI / 180;
  const lat2 = ne.lat() * Math.PI / 180;
  const deltaLat = (ne.lat() - center.lat()) * Math.PI / 180;
  const deltaLng = (ne.lng() - center.lng()) * Math.PI / 180;
  
  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return Math.round(R * c);
};

export const toMeters = (value: number, unit: 'km' | 'm' = 'm'): number => {
  return unit === 'km' ? value * 1000 : value;
};

export const formatCOP = (value: number): string => {
  if (value >= 1000000) {
    const millions = value / 1000000;
    return `$${millions.toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
};

export const parseVoice = (text: string): {
  priceMax?: number;
  bedrooms?: number;
  propertyType?: string;
  location?: string;
} => {
  const filters: any = {};
  
  // Parse price in millions (e.g., "2.5 millones", "3m", "2.5m")
  const priceMatch = text.match(/(\d+(?:\.\d+)?)\s*m(?:illones?)?/i);
  if (priceMatch) {
    filters.priceMax = parseFloat(priceMatch[1]) * 1000000;
  }
  
  // Parse bedrooms (e.g., "3 habitaciones", "2 hab", "4h")
  const bedroomsMatch = text.match(/(\d+)\s*h(?:ab(?:itaciones?)?)?/i);
  if (bedroomsMatch) {
    filters.bedrooms = parseInt(bedroomsMatch[1]);
  }
  
  // Parse property type
  const lowerText = text.toLowerCase();
  if (lowerText.includes('apartamento') || lowerText.includes('apto')) {
    filters.propertyType = 'apartment';
  } else if (lowerText.includes('casa')) {
    filters.propertyType = 'house';
  } else if (lowerText.includes('local') || lowerText.includes('comercial')) {
    filters.propertyType = 'commercial';
  }
  
  // Parse location (e.g., "cerca de poblado", "en envigado")
  const locationMatch = text.match(/(?:cerca de|en)\s+([a-záéíóúñ\s]+)/i);
  if (locationMatch) {
    filters.location = locationMatch[1].trim();
  }
  
  return filters;
};

export const calculateScore = (
  property: any,
  filters: {
    priceMax?: number;
    bedrooms?: number;
    propertyType?: string;
    distance?: number;
  }
): number => {
  let score = 0;
  
  // Price match (0-40 points)
  if (filters.priceMax && property.price) {
    if (property.price <= filters.priceMax) {
      const priceRatio = property.price / filters.priceMax;
      score += (1 - priceRatio) * 40; // Better price = higher score
    }
  } else {
    score += 20; // No filter, give medium score
  }
  
  // Bedrooms match (0-30 points)
  if (filters.bedrooms && property.bedrooms) {
    if (property.bedrooms >= filters.bedrooms) {
      score += 30;
    } else {
      score += (property.bedrooms / filters.bedrooms) * 15;
    }
  } else {
    score += 15;
  }
  
  // Property type match (0-20 points)
  if (filters.propertyType && property.propertyType) {
    if (property.propertyType === filters.propertyType) {
      score += 20;
    }
  } else {
    score += 10;
  }
  
  // Distance (0-10 points, closer is better)
  if (filters.distance !== undefined) {
    const maxDistance = 1000; // 1km max
    const distanceScore = Math.max(0, 1 - (filters.distance / maxDistance));
    score += distanceScore * 10;
  }
  
  return Math.round(score);
};

export const shouldAlert = (score: number, threshold: number = 70): boolean => {
  return score >= threshold;
};

// Debounce helper
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle helper with dynamic interval based on speed
export const createThrottle = () => {
  let lastCall = 0;
  
  return (func: Function, speed: number = 0) => {
    const now = Date.now();
    // If moving fast (>8 m/s), update every 2s; if slow (<2 m/s), every 5s
    const interval = speed > 8 ? 2000 : speed > 2 ? 3000 : 5000;
    
    if (now - lastCall >= interval) {
      lastCall = now;
      func();
      return true;
    }
    return false;
  };
};