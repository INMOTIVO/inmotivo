import { useState } from 'react';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';

interface MapFiltersProps {
  onFiltersChange: (filters: {
    radius: number;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    propertyType?: string;
  }) => void;
}

const MapFilters = ({ onFiltersChange }: MapFiltersProps) => {
  const [radius, setRadius] = useState([5]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [propertyType, setPropertyType] = useState('');

  const handleApplyFilters = () => {
    onFiltersChange({
      radius: radius[0],
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      propertyType: propertyType || undefined,
    });
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <Label className="mb-4 block">Radio de búsqueda: {radius[0]} km</Label>
        <Slider
          value={radius}
          onValueChange={setRadius}
          min={1}
          max={20}
          step={1}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minPrice">Precio mínimo</Label>
          <Input
            id="minPrice"
            type="number"
            placeholder="$0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="maxPrice">Precio máximo</Label>
          <Input
            id="maxPrice"
            type="number"
            placeholder="Sin límite"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bedrooms">Habitaciones mínimas</Label>
          <Input
            id="bedrooms"
            type="number"
            placeholder="Cualquiera"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="propertyType">Tipo de propiedad</Label>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="apartment">Apartamento</SelectItem>
              <SelectItem value="house">Casa</SelectItem>
              <SelectItem value="commercial">Local</SelectItem>
              <SelectItem value="warehouse">Bodega</SelectItem>
              <SelectItem value="studio">Apartaestudio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleApplyFilters} className="w-full">
        Aplicar filtros
      </Button>
    </Card>
  );
};

export default MapFilters;
