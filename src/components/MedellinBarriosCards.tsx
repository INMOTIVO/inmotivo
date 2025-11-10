import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const barriosLinks = [
  {
    title: "El Poblado",
    path: "/medellin/arriendo/apartamentos/el-poblado",
    description: "Zona exclusiva"
  },
  {
    title: "Laureles",
    path: "/medellin/arriendo/apartamentos/laureles",
    description: "Tradicional y completo"
  },
  {
    title: "Belén",
    path: "/medellin/arriendo/apartamentos/belen",
    description: "Familiar y accesible"
  },
  {
    title: "Estadio",
    path: "/medellin/arriendo/apartamentos/estadio",
    description: "Cerca del centro"
  },
  {
    title: "Buenos Aires",
    path: "/medellin/arriendo/apartamentos/buenos-aires",
    description: "En crecimiento"
  }
];

export default function MedellinBarriosCards() {
  return (
    <section className="py-12 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold text-center mb-2">
          Medellín — Barrios populares
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          Explora apartamentos en los barrios más buscados
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {barriosLinks.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={() => {
                if ((window as any).gtag) {
                  (window as any).gtag('event', 'click_internal_link', { 
                    section: 'barrio_cards', 
                    label: item.path.split('/').pop() 
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
