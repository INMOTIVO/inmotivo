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
      <div className="relative h-56 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
          {type}
        </Badge>
      </div>
      
      <div className="p-5 space-y-4 flex flex-col">
        <div className="min-h-[72px] md:min-h-0">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{title}</h3>
          <div className="flex items-center text-muted-foreground text-sm">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground py-2">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            <span>{beds}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            <span>{baths}</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize className="h-4 w-4" />
            <span>{area}</span>
          </div>
        </div>

        <div className="pt-4 border-t mt-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">{price}</p>
              <p className="text-xs text-muted-foreground">por mes</p>
            </div>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/property/${id}`);
              }}
              className="min-w-[100px]"
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
