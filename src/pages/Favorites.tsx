import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: favorites, isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("property_favorites")
        .select(`
          id,
          created_at,
          property:properties (
            id,
            title,
            description,
            property_type,
            address,
            neighborhood,
            city,
            price,
            currency,
            bedrooms,
            bathrooms,
            area_m2,
            images,
            verified,
            status
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-14 md:pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center space-y-4">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto" />
              <h2 className="text-2xl font-bold">Inicia sesión para ver tus favoritos</h2>
              <Button onClick={() => navigate("/auth")}>
                Iniciar sesión
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-14 md:pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="default"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full w-12 h-12 shadow-xl bg-primary hover:bg-primary/90"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
                <Heart className="w-8 h-8 fill-red-500 text-red-500" />
                Mis Favoritos
              </h1>
              <p className="text-muted-foreground mt-1">
                {favorites?.length || 0} propiedad{favorites?.length !== 1 ? 'es' : ''} guardada{favorites?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando favoritos...</p>
            </div>
          ) : favorites && favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((favorite: any) => {
                if (!favorite.property) return null;
                
                const property = favorite.property;
                const images = property.images as string[] || [];
                const propertyTypes: Record<string, string> = {
                  apartment: "Apartamento",
                  house: "Casa",
                  commercial: "Local Comercial",
                  warehouse: "Bodega",
                  studio: "Apartaestudio",
                };
                
                return (
                  <PropertyCard
                    key={favorite.id}
                    id={property.id}
                    title={property.title}
                    price={new Intl.NumberFormat('es-CO', { 
                      style: 'currency', 
                      currency: 'COP',
                      minimumFractionDigits: 0
                    }).format(property.price)}
                    location={`${property.neighborhood ? property.neighborhood + ', ' : ''}${property.city}`}
                    beds={property.bedrooms || 0}
                    baths={property.bathrooms || 0}
                    area={`${property.area_m2}m²`}
                    imageUrl={images[0] || "/placeholder.svg"}
                    type={propertyTypes[property.property_type] || property.property_type}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto opacity-50" />
              <div>
                <h3 className="text-xl font-semibold mb-2">No tienes favoritos aún</h3>
                <p className="text-muted-foreground mb-4">
                  Explora propiedades y guarda tus favoritas haciendo clic en el corazón
                </p>
                <Button onClick={() => navigate("/")}>
                  Explorar propiedades
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;
