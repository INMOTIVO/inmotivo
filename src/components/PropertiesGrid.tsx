import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PropertyCard from "./PropertyCard";

const PropertiesGrid = () => {
  const { data: properties, isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data;
    },
  });

  const propertyTypes: Record<string, string> = {
    apartment: "Apartamento",
    house: "Casa",
    commercial: "Local",
    warehouse: "Bodega",
    studio: "Apartaestudio",
  };

  return (
    <section id="propiedades" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Propiedades <span className="text-primary">destacadas</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Explora las mejores opciones disponibles en Medellín
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando propiedades...</p>
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => {
              const images = property.images as string[] || [];
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
                  imageUrl={images[0] || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"}
                  type={propertyTypes[property.property_type] || property.property_type}
                />
              );
            })}
          </div>
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
