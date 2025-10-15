import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroImage from "@/assets/hero-medellin.jpg";

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("Medellín");

  const handleSearch = () => {
    const element = document.getElementById("propiedades");
    element?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background image with gradient overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-blue-600/90" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Encuentra tu espacio ideal con <span className="text-primary-glow">IA</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
              Búsqueda inteligente con lenguaje natural y geolocalización en tiempo real
            </p>
          </div>

          {/* Search bar */}
          <div className="bg-white rounded-2xl shadow-2xl p-2 max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2 px-4">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Ej: Apartamento con 2 habitaciones cerca del metro..."
                  className="border-0 focus-visible:ring-0 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 px-4 border-t md:border-t-0 md:border-l pt-2 md:pt-0">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Medellín"
                  className="border-0 focus-visible:ring-0 text-base w-full md:w-32"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <Button 
                variant="hero" 
                size="xl" 
                className="md:w-auto"
                onClick={handleSearch}
              >
                Buscar
              </Button>
            </div>
          </div>

          {/* Quick filters */}
          <div className="flex flex-wrap justify-center gap-3">
            {["Apartamentos", "Casas", "Locales", "Bodegas"].map((type) => (
              <button
                key={type}
                className="px-6 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-glow/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
    </section>
  );
};

export default Hero;
