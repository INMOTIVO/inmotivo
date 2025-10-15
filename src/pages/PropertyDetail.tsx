import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Maximize, ArrowLeft, Phone, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
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
          floor,
          parking_spaces,
          furnished,
          pets_allowed,
          images,
          amenities,
          verified,
          status,
          owner:profiles(full_name, phone),
          agency:agencies(name, phone, email)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <p>Propiedad no encontrada</p>
        </div>
      </div>
    );
  }

  const propertyTypes: Record<string, string> = {
    apartment: "Apartamento",
    house: "Casa",
    commercial: "Local Comercial",
    warehouse: "Bodega",
    studio: "Apartaestudio",
  };

  const images = property.images as string[] || [];
  const amenities = property.amenities as string[] || [];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {images.length > 0 && (
                <img
                  src={images[0]}
                  alt={property.title}
                  className="w-full h-96 object-cover rounded-2xl"
                />
              )}

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="bg-primary text-primary-foreground">
                    {propertyTypes[property.property_type]}
                  </Badge>
                  {property.verified && (
                    <Badge variant="secondary">Verificado</Badge>
                  )}
                </div>
                <h1 className="text-4xl font-bold mb-4">{property.title}</h1>
                <div className="flex items-center text-muted-foreground mb-4">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{property.address}, {property.neighborhood}</span>
                </div>

                <div className="flex items-center gap-8 text-lg">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5" />
                    <span>{property.bedrooms} habitaciones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5" />
                    <span>{property.bathrooms} baños</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Maximize className="h-5 w-5" />
                    <span>{property.area_m2} m²</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">Descripción</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {property.description || "Sin descripción disponible."}
                </p>
              </div>

              {amenities.length > 0 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Amenidades</h2>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity, index) => (
                      <Badge key={index} variant="outline">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 p-6 border rounded-2xl bg-card space-y-6">
                <div>
                  <p className="text-3xl font-bold text-primary">
                    ${property.price.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground">por mes</p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Información de contacto</h3>
                  {property.agency ? (
                    <>
                      <p className="font-medium">{property.agency.name}</p>
                      {property.agency.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4" />
                          <span>{property.agency.phone}</span>
                        </div>
                      )}
                      {property.agency.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4" />
                          <span>{property.agency.email}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="font-medium">{property.owner?.full_name || "Propietario"}</p>
                      {property.owner?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4" />
                          <span>{property.owner.phone}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <Button className="w-full" size="lg">
                  Contactar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PropertyDetail;
