import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const cityTypeLinks = [
  {
    title: "Apartamentos en Medellín",
    path: "/medellin/arriendo/apartamentos",
    description: "Búscalo con GPS en vivo"
  },
  {
    title: "Casas en Sabaneta",
    path: "/sabaneta/arriendo/casas",
    description: "Búscalo con GPS en vivo"
  },
  {
    title: "Apartamentos en Itagüí",
    path: "/itagui/arriendo/apartamentos",
    description: "Búscalo con GPS en vivo"
  },
  {
    title: "Apartamentos en Envigado",
    path: "/envigado/arriendo/apartamentos",
    description: "Búscalo con GPS en vivo"
  },
  {
    title: "Apartamentos en Bello",
    path: "/bello/arriendo/apartamentos",
    description: "Búscalo con GPS en vivo"
  }
];

export default function CityTypeCards() {
  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold text-center mb-8">
          Acceso Rápido por Zona
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {cityTypeLinks.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={() => {
                if ((window as any).gtag) {
                  (window as any).gtag('event', 'click_internal_link', { 
                    section: 'city_cards', 
                    label: item.path.split('/')[1] 
                  });
                }
              }}
            >
              <Card className="group rounded-2xl border bg-card hover:shadow-md transition h-full">
                <CardContent className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="size-4 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
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
