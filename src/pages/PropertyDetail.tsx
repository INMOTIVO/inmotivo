import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { MapPin, Bed, Bath, Maximize, ArrowLeft, X, Heart, Upload, Navigation } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactDialog from "@/components/ContactDialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          owner:profiles(full_name, phone),
          agency:agencies(name, phone, email)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Verificar si la propiedad está en favoritos
  const { data: isFavorite, refetch: refetchFavorite } = useQuery({
    queryKey: ["favorite", id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from("property_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("property_id", id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!id,
  });

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para guardar favoritos");
      navigate("/auth");
      return;
    }

    try {
      if (isFavorite) {
        // Eliminar de favoritos
        const { error } = await supabase
          .from("property_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("property_id", id);

        if (error) throw error;
        toast.success("Eliminado de favoritos");
      } else {
        // Agregar a favoritos
        const { error } = await supabase
          .from("property_favorites")
          .insert({
            user_id: user.id,
            property_id: id,
          });

        if (error) throw error;
        toast.success("Agregado a favoritos");
      }
      
      // Invalidar las queries de favoritos para actualizar el contador
      await refetchFavorite();
      await queryClient.invalidateQueries({ queryKey: ["favorites-count", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["favorites", user.id] });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Error al actualizar favoritos");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: property?.title || 'Propiedad en Inmotivo',
      text: `${property?.title} - ${property?.neighborhood}, ${property?.city}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("Compartido exitosamente");
      } else {
        // Fallback: copiar al portapapeles
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Enlace copiado al portapapeles");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Error sharing:", error);
        toast.error("Error al compartir");
      }
    }
  };

  const handleNavigate = () => {
    if (!property?.latitude || !property?.longitude) {
      toast.error("Esta propiedad no tiene ubicación disponible");
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Navegar a la página de navegación con origen y destino
          navigate(`/navigate?originLat=${latitude}&originLng=${longitude}&destLat=${property.latitude}&destLng=${property.longitude}&destName=${encodeURIComponent(property.title)}`);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("No se pudo obtener tu ubicación");
        }
      );
    } else {
      toast.error("Tu navegador no soporta geolocalización");
    }
  };

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
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <Button
              variant="default"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full w-12 h-12 shadow-xl bg-primary hover:bg-primary/90"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleNavigate}
                className="rounded-full h-12 px-6 shadow-xl bg-green-600 hover:bg-green-700 text-white border-0 transition-all duration-200 hover:scale-105"
              >
                <Navigation className="h-5 w-5 mr-2" />
                Ir
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                className="rounded-full w-12 h-12 shadow-xl bg-white hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 hover:scale-105"
              >
                <Upload className="h-5 w-5 text-gray-600 group-hover:text-primary" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleFavorite}
                className={`rounded-full w-12 h-12 shadow-xl transition-all duration-200 hover:scale-105 ${
                  isFavorite 
                    ? 'bg-red-50 hover:bg-red-100 border-red-200' 
                    : 'bg-white hover:bg-primary/10 hover:border-primary/30'
                }`}
              >
                <Heart 
                  className={`h-5 w-5 ${
                    isFavorite 
                      ? 'fill-red-500 text-red-500' 
                      : 'text-gray-600'
                  }`} 
                />
              </Button>
            </div>
          </div>

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
                  
                  {images.slice(1, 12).length > 0 && (
                    <Carousel
                      opts={{
                        align: "start",
                        loop: false,
                      }}
                      className="w-full"
                    >
                      <CarouselContent className="-ml-2 md:-ml-3">
                        {images.slice(1, 12).map((image, index) => (
                          <CarouselItem key={index} className="pl-2 md:pl-3 basis-1/3 md:basis-1/4 lg:basis-1/5">
                            <img
                              src={image}
                              alt={`${property.title} - ${index + 2}`}
                              className="w-full h-20 md:h-32 object-cover rounded-md md:rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setSelectedImageIndex(index + 1)}
                            />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-0" />
                      <CarouselNext className="right-0" />
                    </Carousel>
                  )}
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
                {(property as any).property_code && (
                  <Badge variant="outline" className="font-mono text-xs md:text-sm">
                    {(property as any).property_code}
                  </Badge>
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
                  <h2 className="text-2xl font-semibold mb-4">Facilidades</h2>
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
