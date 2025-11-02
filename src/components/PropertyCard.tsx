import { MapPin, Bed, Bath, Maximize } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
