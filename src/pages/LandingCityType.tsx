import { useParams, useNavigate } from "react-router-dom";
import HomeMenu from "@/components/HomeMenu";
import PropertyCard from "@/components/PropertyCard";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { MapPin, Home, Building2, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const LandingCityType = () => {
  const { city, type } = useParams<{ city: string; type: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const cityName = city ? decodeURIComponent(city) : "";
  const propertyType = type ? decodeURIComponent(type) : "";

  const { data: properties, isLoading } = useQuery({
    queryKey: ["landing-properties", cityName, propertyType],
    queryFn: async () => {
      let query = supabase
        .from("properties")
        .select("*")
        .eq("status", "available")
        .limit(12);

      if (cityName) {
        query = query.ilike("city", `%${cityName}%`);
      }

      if (propertyType) {
        query = query.ilike("property_type", `%${propertyType}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: favorites } = useQuery({
    queryKey: ["user-favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("property_favorites")
        .select("property_id")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data.map(f => f.property_id);
    },
    enabled: !!user,
  });

  const propertyTypes: Record<string, string> = {
    apartment: "Apartamento",
    house: "Casa",
    commercial: "Local",
    warehouse: "Bodega",
    studio: "Apartaestudio",
  };

  const defaultImages: Record<string, string> = {
    apartment: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    house: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
    commercial: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    warehouse: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
    studio: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  };

  const getPropertyTypeIcon = () => {
    if (propertyType.toLowerCase().includes("apartamento")) return <Building2 className="w-6 h-6" />;
    return <Home className="w-6 h-6" />;
  };

  const getTitle = () => {
    if (cityName && propertyType) {
      return `${propertyType} en ${cityName}`;
    } else if (cityName) {
      return `Propiedades en ${cityName}`;
    } else if (propertyType) {
      return propertyType;
    }
    return "Propiedades Disponibles";
  };

  return (
    <div className="min-h-screen bg-background">
      <HomeMenu />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header Section */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>

            <div className="flex items-center gap-3 mb-4">
              {cityName && (
                <div className="flex items-center gap-2 text-primary">
                  <MapPin className="w-6 h-6" />
                  <span className="text-xl font-semibold">{cityName}</span>
                </div>
              )}
              {propertyType && (
                <div className="flex items-center gap-2 text-primary">
                  {getPropertyTypeIcon()}
                  <span className="text-xl font-semibold">{propertyType}</span>
                </div>
              )}
            </div>

            <h1 className="text-4xl font-bold text-foreground mb-2">
              {getTitle()}
            </h1>
            <p className="text-muted-foreground text-lg">
              Encuentra tu próximo hogar con las mejores opciones disponibles
            </p>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">Cargando propiedades...</p>
              </div>
            ) : properties && properties.length > 0 ? (
              properties.map((property) => {
                const images = (property.images as string[]) || [];
                const defaultImage = defaultImages[property.property_type] || defaultImages.apartment;
                const isFavorite = favorites?.includes(property.id) || false;

                return (
                  <PropertyCard
                    key={property.id}
                    id={property.id}
                    title={property.title}
                    price={`$${property.price.toLocaleString()}`}
                    location={`${property.neighborhood}, ${property.city}`}
                    beds={property.bedrooms}
                    baths={property.bathrooms}
                    area={`${property.area_m2} m²`}
                    imageUrl={images[0] || defaultImage}
                    type={propertyTypes[property.property_type] || property.property_type}
                    isFavorite={isFavorite}
                  />
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">
                  No se encontraron propiedades con estos filtros.
                </p>
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center bg-muted/30 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">¿No encuentras lo que buscas?</h2>
            <p className="text-muted-foreground mb-6">
              Usa nuestra búsqueda avanzada o búsqueda por voz para encontrar exactamente lo que necesitas
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button onClick={() => navigate("/mapa")} size="lg">
                <MapPin className="w-4 h-4 mr-2" />
                Buscar en el mapa
              </Button>
              <Button onClick={() => navigate("/catalogo")} variant="outline" size="lg">
                Ver catálogo completo
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LandingCityType;
