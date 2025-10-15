import PropertyCard from "./PropertyCard";

// Sample properties for MVP
const sampleProperties = [
  {
    id: 1,
    title: "Apartamento Moderno en El Poblado",
    price: "$2,500,000",
    location: "El Poblado, Medellín",
    beds: 2,
    baths: 2,
    area: "85 m²",
    imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    type: "Apartamento"
  },
  {
    id: 2,
    title: "Apartamento Amoblado Cerca Metro",
    price: "$1,800,000",
    location: "Laureles, Medellín",
    beds: 3,
    baths: 2,
    area: "95 m²",
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    type: "Apartamento"
  },
  {
    id: 3,
    title: "Casa Espaciosa con Jardín",
    price: "$3,200,000",
    location: "Envigado, Antioquia",
    beds: 4,
    baths: 3,
    area: "180 m²",
    imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
    type: "Casa"
  },
  {
    id: 4,
    title: "Local Comercial Zona Centro",
    price: "$4,500,000",
    location: "Centro, Medellín",
    beds: 0,
    baths: 2,
    area: "120 m²",
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    type: "Local"
  },
  {
    id: 5,
    title: "Apartaestudio Cerca Universidad",
    price: "$1,200,000",
    location: "Boston, Medellín",
    beds: 1,
    baths: 1,
    area: "45 m²",
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    type: "Apartamento"
  },
  {
    id: 6,
    title: "Bodega Industrial",
    price: "$6,000,000",
    location: "Itagüí, Antioquia",
    beds: 0,
    baths: 2,
    area: "300 m²",
    imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
    type: "Bodega"
  }
];

const PropertiesGrid = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Propiedades <span className="text-primary">destacadas</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Explora las mejores opciones disponibles en Medellín
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sampleProperties.map((property) => (
            <PropertyCard key={property.id} {...property} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PropertiesGrid;
