import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PropertyCard from "./PropertyCard";
import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

const PropertiesGrid = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!carouselApi) return;

    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [carouselApi]);

  const { data: properties, isLoading } = useQuery({
    queryKey: ["properties", userLocation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "available")
        .lte("price", 25000000)
        .limit(12);
      
      if (error) throw error;

      if (userLocation && data) {
        const propertiesWithDistance = data.map((property) => {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            Number(property.latitude),
            Number(property.longitude)
          );
          return { ...property, distance };
        });
        return propertiesWithDistance.sort((a, b) => a.distance - b.distance);
      }

      return data;
    },
    enabled: true,
  });

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const propertyTypes: Record<string, string> = {
    apartment: "Apartamento",
    house: "Casa",
    commercial: "Local",
    warehouse: "Bodega",
    studio: "Apartaestudio"
  };

  const defaultImages: Record<string, string> = {
    apartment: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    house: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
    commercial: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    warehouse: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
    studio: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"
  };

  return (
    <section id="propiedades" className="py-8 md:py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6 space-y-2">
          <h2 className="text-2xl md:text-4xl font-bold">
            Propiedades <span className="text-primary">destacadas</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Explora las mejores opciones disponibles
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando propiedades...</p>
          </div>
        ) : properties && properties.length > 0 ? (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            setApi={setCarouselApi}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {properties.map((property) => {
                const images = (property.images as string[]) || [];
                const defaultImage = defaultImages[property.property_type] || defaultImages.apartment;
                
                return (
                  <CarouselItem key={property.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                    <PropertyCard
                      id={property.id}
                      title={property.title}
                      price={`$${property.price.toLocaleString()}`}
                      location={`${property.neighborhood}, ${property.city}`}
                      beds={property.bedrooms}
                      baths={property.bathrooms}
                      area={`${property.area_m2} m²`}
                      imageUrl={images[0] || defaultImage}
                      type={propertyTypes[property.property_type] || property.property_type}
                    />
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No hay propiedades disponibles en este momento.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PropertiesGrid;
