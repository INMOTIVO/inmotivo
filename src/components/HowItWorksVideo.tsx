import { Play, MapPin, Search, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import videoThumbnail from "@/assets/video-thumbnail.jpg";

const HowItWorksVideo = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayVideo = () => {
    setIsPlaying(true);
    // Aquí se puede agregar la lógica para reproducir el video real
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-accent/20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 space-y-4 animate-fade-in">
            <h2 className="text-3xl md:text-5xl font-bold">
              Descubre cómo funciona <span className="text-primary">INMOTIVO</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Tecnología inteligente que encuentra propiedades a tu alrededor según tus preferencias
            </p>
          </div>

          {/* Video Container */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-12 group animate-scale-in">
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 relative">
              {/* Video Thumbnail */}
              <img 
                src={videoThumbnail} 
                alt="Cómo funciona INMOTIVO" 
                className="w-full h-full object-cover"
              />
              
              {/* Play Button Overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-all duration-300">
                  <Button
                    size="lg"
                    onClick={handlePlayVideo}
                    className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-white hover:bg-white/90 text-primary hover:scale-110 transition-all duration-300 shadow-2xl"
                  >
                    <Play className="h-10 w-10 md:h-12 md:w-12 ml-1" fill="currentColor" />
                  </Button>
                </div>
              )}
              
              {/* Video Player */}
              {isPlaying && (
                <div className="absolute inset-0">
                  <iframe 
                    src="/inmotivo-video-embed.html" 
                    style={{width: '100%', height: '100%', border: 0, borderRadius: '24px', overflow: 'hidden'}}
                    title="Video explicativo de INMOTIVO"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg animate-fade-in">
              <div className="inline-flex p-4 rounded-xl bg-primary/10 text-primary mb-4">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">1. Describe tu búsqueda</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Usa lenguaje natural para describir el inmueble que buscas
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="inline-flex p-4 rounded-xl bg-accent/10 text-accent mb-4">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">2. Ubicación en tiempo real</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                INMOTIVO detecta tu ubicación y busca propiedades cercanas
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="inline-flex p-4 rounded-xl bg-primary/10 text-primary mb-4">
                <Navigation className="h-8 w-8" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">3. Navega y explora</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Ve propiedades mientras te desplazas por la ciudad
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksVideo;
