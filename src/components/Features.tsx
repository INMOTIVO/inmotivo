import { Brain, MapPin, Zap, Shield } from "lucide-react";
const features = [{
  icon: Brain,
  title: "Búsqueda con IA",
  description: "Escribe en lenguaje natural y encuentra exactamente lo que buscas. Nuestra IA entiende tus preferencias."
}, {
  icon: MapPin,
  title: "GPS en Tiempo Real",
  description: "Descubre propiedades cercanas mientras te mueves por la ciudad. Perfecto para explorar zonas."
}, {
  icon: Zap,
  title: "Resultados Instantáneos",
  description: "Información actualizada en tiempo real. Sin esperas, sin propiedades desactualizadas."
}, {
  icon: Shield,
  title: "Verificación Garantizada",
  description: "Todas las propiedades verificadas. Conecta directamente con dueños e inmobiliarias certificadas."
}];
const Features = () => {
  return <section className="py-24 bg-gradient-to-b from-background to-accent/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            La forma más inteligente de <span className="text-primary">arrendar</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Tecnología de vanguardia que simplifica tu búsqueda </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => <div key={index} className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <div className="mb-6 inline-flex p-4 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>)}
        </div>
      </div>
    </section>;
};
export default Features;