import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PropertyCard from "./PropertyCard";
const PropertiesGrid = () => {
  const {
    data: properties,
    isLoading
  } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("properties").select("*").eq("status", "available").lte("price", 25000000) // Max price 25M
      .order("created_at", {
        ascending: false
      }).limit(6);
      if (error) throw error;
      return data;
    }
  });
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
  return <section id="propiedades" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Propiedades <span className="text-primary">destacadas</span>
          </h2>
          <p className="text-xl text-muted-foreground">Explora las mejores opciones disponibles </p>
        </div>

        {isLoading ? <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando propiedades...</p>
          </div> : properties && properties.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {properties.map(property => {
          const images = property.images as string[] || [];
          const defaultImage = defaultImages[property.property_type] || defaultImages.apartment;
          return <PropertyCard key={property.id} id={property.id} title={property.title} price={`$${property.price.toLocaleString()}`} location={`${property.neighborhood}, ${property.city}`} beds={property.bedrooms} baths={property.bathrooms} area={`${property.area_m2} m²`} imageUrl={images[0] || defaultImage} type={propertyTypes[property.property_type] || property.property_type} />;
        })}
          </div> : <div className="text-center py-12">
            <p className="text-muted-foreground">
              No hay propiedades disponibles en este momento.
            </p>
          </div>}
      </div>
    </section>;
};
export default PropertiesGrid;