import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const cities = [
  {
    name: "Medellín",
    type: "Apartamentos",
    path: "/medellin/arriendo/apartamentos",
    description: "El Poblado, Laureles, Belén"
  },
  {
    name: "Sabaneta",
    type: "Casas",
    path: "/sabaneta/arriendo/casas",
    description: "Aves María, Aliadas del Sur"
  },
  {
    name: "Itagüí",
    type: "Apartamentos",
    path: "/itagui/arriendo/apartamentos",
    description: "Santa María, Ditaires"
  },
  {
    name: "Envigado",
    type: "Apartamentos",
    path: "/envigado/arriendo/apartamentos",
    description: "Zúñiga, La Magnolia"
  },
  {
    name: "Bello",
    type: "Apartamentos",
    path: "/bello/arriendo/apartamentos",
    description: "Santa Ana, Niquía"
  }
];

export default function PopularCities() {
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-2">
          Zonas Populares
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          Encuentra tu próximo hogar en las mejores zonas del Valle de Aburrá
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cities.map((city) => (
            <Link key={city.path} to={city.path}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        {city.type} en {city.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {city.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
