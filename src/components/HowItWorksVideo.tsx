import { Play, MapPin, Search, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import videoThumbnail from "@/assets/video-thumbnail.jpg";

const HowItWorksVideo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [flippedCards, setFlippedCards] = useState([false, false, false]);

  const handlePlayVideo = () => {
    setIsPlaying(true);
    // Aquí se puede agregar la lógica para reproducir el video real
  };

  useEffect(() => {
    const flipCard = (index: number) => {
      setTimeout(() => {
        setFlippedCards(prev => {
          const newState = [...prev];
          newState[index] = !newState[index];
          return newState;
        });
      }, index * 1000); // Delay de 1 segundo entre cada tarjeta
    };

    const interval = setInterval(() => {
      flipCard(0);
      flipCard(1);
      flipCard(2);
    }, 6000); // Ciclo completo cada 6 segundos

    return () => clearInterval(interval);
  }, []);

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
                  <video
                    className="w-full h-full object-cover"
                    autoPlay
                    controls
                    playsInline
                  >
                    <source src="https://download.samplelib.com/mp4/sample-5s.mp4" type="video/mp4" />
                    Tu navegador no soporta el elemento de video.
                  </video>
                </div>
              )}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-3 gap-2 md:gap-8">
            {/* Card 1 */}
            <div className="relative h-48 md:h-64 group" style={{ perspective: '1000px' }}>
              {/* Animated border glow */}
              <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[gradient-flow_3s_linear_infinite] opacity-75 blur-sm"></div>
              
              <div 
                className={`relative w-full h-full transition-transform duration-700 ${flippedCards[0] ? '[transform:rotateY(180deg)]' : ''}`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <div className="absolute inset-0 text-center p-3 md:p-6 rounded-xl md:rounded-2xl bg-card border-2 border-primary/50 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.3)]" style={{ backfaceVisibility: 'hidden' }}>
                  <div className="inline-flex p-2 md:p-4 rounded-lg md:rounded-xl bg-primary/10 text-primary mb-2 md:mb-4">
                    <Search className="h-4 w-4 md:h-8 md:w-8" />
                  </div>
                  <h3 className="text-xs md:text-xl font-semibold">1. Describe tu búsqueda</h3>
                </div>
                {/* Back */}
                <div className="absolute inset-0 text-center px-3 py-4 md:p-6 rounded-xl md:rounded-2xl bg-card/95 backdrop-blur-sm border-[3px] border-primary shadow-[0_0_20px_rgba(var(--primary),0.5)] flex items-center justify-center [transform:rotateY(180deg)]" style={{ backfaceVisibility: 'hidden' }}>
                  <p className="text-xs leading-snug md:text-base text-foreground font-medium md:leading-relaxed">
                    Usa lenguaje natural para describir el inmueble que buscas
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="relative h-48 md:h-64 group" style={{ perspective: '1000px' }}>
              {/* Animated border glow with delay */}
              <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_100%] animate-[gradient-flow_3s_linear_infinite_1s] opacity-75 blur-sm"></div>
              
              <div 
                className={`relative w-full h-full transition-transform duration-700 ${flippedCards[1] ? '[transform:rotateY(180deg)]' : ''}`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <div className="absolute inset-0 text-center p-3 md:p-6 rounded-xl md:rounded-2xl bg-card border-2 border-accent/50 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(var(--accent),0.3)]" style={{ backfaceVisibility: 'hidden' }}>
                  <div className="inline-flex p-2 md:p-4 rounded-lg md:rounded-xl bg-accent/10 text-accent mb-2 md:mb-4">
                    <MapPin className="h-4 w-4 md:h-8 md:w-8" />
                  </div>
                  <h3 className="text-xs md:text-xl font-semibold">2. Ubicación en tiempo real</h3>
                </div>
                {/* Back */}
                <div className="absolute inset-0 text-center px-3 py-4 md:p-6 rounded-xl md:rounded-2xl bg-card/95 backdrop-blur-sm border-[3px] border-accent shadow-[0_0_20px_rgba(var(--accent),0.5)] flex items-center justify-center [transform:rotateY(180deg)]" style={{ backfaceVisibility: 'hidden' }}>
                  <p className="text-xs leading-snug md:text-base text-foreground font-medium md:leading-relaxed">
                    INMOTIVO detecta tu ubicación y busca propiedades cercanas
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="relative h-48 md:h-64 group" style={{ perspective: '1000px' }}>
              {/* Animated border glow with delay */}
              <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[gradient-flow_3s_linear_infinite_2s] opacity-75 blur-sm"></div>
              
              <div 
                className={`relative w-full h-full transition-transform duration-700 ${flippedCards[2] ? '[transform:rotateY(180deg)]' : ''}`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <div className="absolute inset-0 text-center p-3 md:p-6 rounded-xl md:rounded-2xl bg-card border-2 border-primary/50 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.3)]" style={{ backfaceVisibility: 'hidden' }}>
                  <div className="inline-flex p-2 md:p-4 rounded-lg md:rounded-xl bg-primary/10 text-primary mb-2 md:mb-4">
                    <Navigation className="h-4 w-4 md:h-8 md:w-8" />
                  </div>
                  <h3 className="text-xs md:text-xl font-semibold">3. Navega y explora</h3>
                </div>
                {/* Back */}
                <div className="absolute inset-0 text-center px-3 py-4 md:p-6 rounded-xl md:rounded-2xl bg-card/95 backdrop-blur-sm border-[3px] border-primary shadow-[0_0_20px_rgba(var(--primary),0.5)] flex items-center justify-center [transform:rotateY(180deg)]" style={{ backfaceVisibility: 'hidden' }}>
                  <p className="text-xs leading-snug md:text-base text-foreground font-medium md:leading-relaxed">
                    Ve propiedades mientras te desplazas por la ciudad
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksVideo;
