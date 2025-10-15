import { Building2, MapPin, Sparkles } from "lucide-react";

// Componentes de piezas publicitarias para redes sociales y campañas

export const SocialAdTenant = () => (
  <div className="w-[1080px] h-[1080px] bg-gradient-to-br from-primary via-primary-glow to-accent text-primary-foreground flex flex-col items-center justify-center p-16 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full opacity-10">
      <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
    </div>
    
    <div className="relative z-10 text-center space-y-8">
      <Sparkles className="h-24 w-24 mx-auto" />
      <h1 className="text-7xl font-bold leading-tight">
        Encuentra tu<br />espacio ideal<br />con IA
      </h1>
      <p className="text-3xl opacity-90">
        Búsqueda inteligente + GPS en tiempo real
      </p>
      <div className="pt-8">
        <div className="inline-block bg-white text-primary px-12 py-6 rounded-2xl text-4xl font-bold">
          ARRENDO.COM
        </div>
      </div>
    </div>
  </div>
);

export const SocialAdOwner = () => (
  <div className="w-[1080px] h-[1080px] bg-gradient-to-br from-accent via-primary to-primary-glow text-primary-foreground flex flex-col items-center justify-center p-16 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full opacity-10">
      <div className="absolute top-20 right-20 w-64 h-64 bg-white rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl" />
    </div>
    
    <div className="relative z-10 text-center space-y-8">
      <Building2 className="h-24 w-24 mx-auto" />
      <h1 className="text-7xl font-bold leading-tight">
        Publica tu<br />propiedad<br />HOY GRATIS
      </h1>
      <p className="text-3xl opacity-90">
        Miles de clientes buscando arriendos
      </p>
      <div className="pt-8 space-y-6">
        <div className="flex items-center justify-center gap-8 text-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full" />
            <span>+50K búsquedas/mes</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full" />
            <span>85% contacto</span>
          </div>
        </div>
        <div className="inline-block bg-white text-primary px-12 py-6 rounded-2xl text-4xl font-bold">
          ARRENDO.COM/PUBLICAR
        </div>
      </div>
    </div>
  </div>
);

export const BannerAdTenant = () => (
  <div className="w-[728px] h-[90px] bg-gradient-to-r from-primary to-primary-glow text-primary-foreground flex items-center justify-between px-8">
    <div className="flex items-center gap-4">
      <MapPin className="h-12 w-12" />
      <div>
        <div className="text-2xl font-bold">Búsqueda inteligente con IA</div>
        <div className="text-sm opacity-90">Encuentra arriendos en Medellín</div>
      </div>
    </div>
    <div className="bg-white text-primary px-6 py-3 rounded-lg font-bold text-lg hover:scale-105 transition-transform cursor-pointer">
      Buscar ahora →
    </div>
  </div>
);

export const BannerAdOwner = () => (
  <div className="w-[728px] h-[90px] bg-gradient-to-r from-accent to-primary text-primary-foreground flex items-center justify-between px-8">
    <div className="flex items-center gap-4">
      <Building2 className="h-12 w-12" />
      <div>
        <div className="text-2xl font-bold">Publica tu propiedad GRATIS</div>
        <div className="text-sm opacity-90">+50K búsquedas mensuales</div>
      </div>
    </div>
    <div className="bg-white text-primary px-6 py-3 rounded-lg font-bold text-lg hover:scale-105 transition-transform cursor-pointer">
      Publicar →
    </div>
  </div>
);

// Story format (vertical)
export const StoryAdTenant = () => (
  <div className="w-[1080px] h-[1920px] bg-gradient-to-b from-primary via-primary-glow to-accent text-primary-foreground flex flex-col items-center justify-center p-16 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full opacity-10">
      <div className="absolute top-40 left-20 w-96 h-96 bg-white rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
    </div>
    
    <div className="relative z-10 text-center space-y-12">
      <Sparkles className="h-32 w-32 mx-auto animate-pulse" />
      <h1 className="text-8xl font-bold leading-tight">
        Tu próximo<br />hogar está<br />a un tap
      </h1>
      <p className="text-4xl opacity-90">
        🤖 Búsqueda con IA<br />
        📍 GPS en tiempo real<br />
        ⚡ Resultados al instante
      </p>
      <div className="pt-12">
        <div className="inline-block bg-white text-primary px-16 py-8 rounded-3xl text-5xl font-bold">
          Desliza arriba
        </div>
        <div className="mt-6 text-3xl">
          ARRENDO.COM
        </div>
      </div>
    </div>
  </div>
);

export const StoryAdOwner = () => (
  <div className="w-[1080px] h-[1920px] bg-gradient-to-b from-accent via-primary to-primary-glow text-primary-foreground flex flex-col items-center justify-center p-16 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full opacity-10">
      <div className="absolute top-40 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
      <div className="absolute bottom-40 left-20 w-96 h-96 bg-white rounded-full blur-3xl" />
    </div>
    
    <div className="relative z-10 text-center space-y-12">
      <Building2 className="h-32 w-32 mx-auto animate-pulse" />
      <h1 className="text-8xl font-bold leading-tight">
        Arrienda tu<br />propiedad<br />más rápido
      </h1>
      <div className="space-y-8 text-4xl">
        <div className="flex items-center justify-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full" />
          <span>50K+ búsquedas/mes</span>
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full" />
          <span>Publicación GRATIS</span>
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full" />
          <span>Leads calificados</span>
        </div>
      </div>
      <div className="pt-12">
        <div className="inline-block bg-white text-primary px-16 py-8 rounded-3xl text-5xl font-bold">
          Desliza arriba
        </div>
        <div className="mt-6 text-3xl">
          ARRENDO.COM/PUBLICAR
        </div>
      </div>
    </div>
  </div>
);