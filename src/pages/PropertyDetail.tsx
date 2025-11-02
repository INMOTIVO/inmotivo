import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { MapPin, Bed, Bath, Maximize, ArrowLeft, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactDialog from "@/components/ContactDialog";

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

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
      <main className="pt-14 md:pt-16">
        <div className="container mx-auto px-4 py-4 md:py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 md:mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>

          <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {images.length > 0 && (
                <div className="space-y-3 md:space-y-4">
                  <img
                    src={images[0]}
                    alt={property.title}
                    className="w-full h-64 md:h-96 object-cover rounded-lg md:rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedImageIndex(0)}
                  />
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    {images.slice(1, 7).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${property.title} - ${index + 2}`}
                        className="w-full h-20 md:h-32 object-cover rounded-md md:rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedImageIndex(index + 1)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 md:gap-3 mb-3 flex-wrap">
                  <Badge className="bg-primary text-primary-foreground text-xs md:text-sm">
                    {propertyTypes[property.property_type]}
                  </Badge>
                  {property.verified && (
                    <Badge variant="secondary" className="text-xs md:text-sm">Verificado</Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4">{property.title}</h1>
                <div className="flex items-center text-muted-foreground mb-4 text-sm md:text-base">
                  <MapPin className="h-4 w-4 md:h-5 md:w-5 mr-2" />
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

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => setShowContactDialog(true)}
                >
                  Contactar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      
      <ContactDialog
        open={showContactDialog}
        onOpenChange={setShowContactDialog}
        property={{
          id: property.id,
          title: property.title,
          agency: property.agency,
          owner: property.owner,
        }}
      />

      <Dialog open={selectedImageIndex !== null} onOpenChange={() => setSelectedImageIndex(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-50 text-white hover:bg-white/20"
            onClick={() => setSelectedImageIndex(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          
          <Carousel
            opts={{
              startIndex: selectedImageIndex ?? 0,
              loop: true,
            }}
            className="w-full h-full flex items-center justify-center"
          >
            <CarouselContent className="h-[90vh]">
              {images.map((image, index) => (
                <CarouselItem key={index} className="flex items-center justify-center">
                  <img
                    src={image}
                    alt={`${property.title} - ${index + 1}`}
                    className="max-h-[90vh] max-w-full object-contain"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 bg-white/20 border-0 text-white hover:bg-white/30" />
            <CarouselNext className="right-4 bg-white/20 border-0 text-white hover:bg-white/30" />
          </Carousel>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyDetail;
