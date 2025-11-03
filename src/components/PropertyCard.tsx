import { MapPin, Bed, Bath, Maximize, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PropertyCardProps {
  id: string;
  title: string;
  price: string;
  location: string;
  beds: number;
  baths: number;
  area: string;
  imageUrl: string;
  type: string;
}

const PropertyCard = ({ id, title, price, location, beds, baths, area, imageUrl, type }: PropertyCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error("Debes iniciar sesión para guardar favoritos");
      navigate("/auth");
      return;
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("property_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("property_id", id);

        if (error) throw error;
        toast.success("Eliminado de favoritos");
      } else {
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

  return (
    <Card 
      className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/property/${id}`)}
    >
      <div className="relative h-40 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs">
          {type}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleFavorite}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full shadow-lg ${
            isFavorite 
              ? 'bg-red-50 hover:bg-red-100' 
              : 'bg-white/90 hover:bg-white'
          }`}
        >
          <Heart 
            className={`h-4 w-4 ${
              isFavorite 
                ? 'fill-red-500 text-red-500' 
                : 'text-gray-600'
            }`} 
          />
        </Button>
      </div>
      
      <div className="p-4 space-y-3 flex flex-col">
        <div className="min-h-[60px] md:min-h-0">
          <h3 className="font-semibold text-base mb-1.5 line-clamp-2">{title}</h3>
          <div className="flex items-center text-muted-foreground text-xs">
            <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground py-1.5">
          <div className="flex items-center gap-1">
            <Bed className="h-3.5 w-3.5" />
            <span>{beds}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            <span>{baths}</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize className="h-3.5 w-3.5" />
            <span>{area}</span>
          </div>
        </div>

        <div className="pt-3 border-t mt-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-primary">{price}</p>
              <p className="text-[10px] text-muted-foreground">por mes</p>
            </div>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/property/${id}`);
              }}
              size="sm"
              className="min-w-[80px]"
            >
              Ver
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PropertyCard;
