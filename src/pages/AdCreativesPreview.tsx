import { 
  SocialAdTenant, 
  SocialAdOwner, 
  BannerAdTenant, 
  BannerAdOwner,
  StoryAdTenant,
  StoryAdOwner 
} from "@/components/AdCreatives";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

// Esta página es solo para previsualizar y exportar las piezas publicitarias
// No está pensada para usuarios finales, sino para el equipo de marketing

const AdCreativesPreview = () => {
  const downloadAd = (elementId: string, filename: string) => {
    // Esta función permitiría descargar las piezas como imagen
    // Requeriría implementar html2canvas o similar
    alert(`Para descargar, usa una herramienta de captura de pantalla o implementa html2canvas. Nombre sugerido: ${filename}`);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Piezas Publicitarias MULPROP</h1>
          <p className="text-xl text-muted-foreground">
            Previsualización de creatividades para campañas de marketing
          </p>
          <p className="text-sm text-muted-foreground">
            💡 Tip: Usa captura de pantalla o implementa html2canvas para exportar
          </p>
        </div>

        {/* INQUILINOS - Posts Cuadrados */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Posts Cuadrados - Inquilinos</h2>
              <p className="text-muted-foreground">1080x1080px - Instagram Feed, Facebook Post</p>
            </div>
            <Button onClick={() => downloadAd('social-tenant', 'mulprop-post-inquilinos.png')}>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
          </div>
          <div id="social-tenant" className="inline-block">
            <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
              <SocialAdTenant />
            </div>
          </div>
        </section>

        {/* PROPIETARIOS - Posts Cuadrados */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Posts Cuadrados - Propietarios</h2>
              <p className="text-muted-foreground">1080x1080px - Instagram Feed, Facebook Post, LinkedIn</p>
            </div>
            <Button onClick={() => downloadAd('social-owner', 'mulprop-post-propietarios.png')}>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
          </div>
          <div id="social-owner" className="inline-block">
            <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
              <SocialAdOwner />
            </div>
          </div>
        </section>

        {/* INQUILINOS - Stories */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Stories - Inquilinos</h2>
              <p className="text-muted-foreground">1080x1920px - Instagram Stories, TikTok</p>
            </div>
            <Button onClick={() => downloadAd('story-tenant', 'mulprop-story-inquilinos.png')}>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
          </div>
          <div id="story-tenant" className="inline-block">
            <div style={{ transform: 'scale(0.3)', transformOrigin: 'top left' }}>
              <StoryAdTenant />
            </div>
          </div>
        </section>

        {/* PROPIETARIOS - Stories */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Stories - Propietarios</h2>
              <p className="text-muted-foreground">1080x1920px - Instagram Stories, WhatsApp Status</p>
            </div>
            <Button onClick={() => downloadAd('story-owner', 'mulprop-story-propietarios.png')}>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
          </div>
          <div id="story-owner" className="inline-block">
            <div style={{ transform: 'scale(0.3)', transformOrigin: 'top left' }}>
              <StoryAdOwner />
            </div>
          </div>
        </section>

        {/* Banners Web */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold">Banners Web</h2>
          <p className="text-muted-foreground">728x90px - Google Display Network, sitios web</p>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Banner Inquilinos</h3>
                <Button size="sm" onClick={() => downloadAd('banner-tenant', 'mulprop-banner-inquilinos.png')}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar
                </Button>
              </div>
              <div id="banner-tenant">
                <BannerAdTenant />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Banner Propietarios</h3>
                <Button size="sm" onClick={() => downloadAd('banner-owner', 'mulprop-banner-propietarios.png')}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar
                </Button>
              </div>
              <div id="banner-owner">
                <BannerAdOwner />
              </div>
            </div>
          </div>
        </section>

        {/* Guía de uso */}
        <section className="bg-card p-8 rounded-lg space-y-4">
          <h2 className="text-2xl font-bold">📋 Guía de Uso</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>1. <strong>Instagram Feed:</strong> Posts cuadrados 1080x1080</p>
            <p>2. <strong>Instagram Stories:</strong> Stories verticales 1080x1920</p>
            <p>3. <strong>Facebook:</strong> Posts cuadrados 1080x1080</p>
            <p>4. <strong>LinkedIn:</strong> Post propietarios 1080x1080</p>
            <p>5. <strong>Google Display:</strong> Banners 728x90</p>
            <p>6. <strong>TikTok:</strong> Stories verticales 1080x1920</p>
          </div>
          <p className="text-sm italic">
            💡 Para más información, consulta MARKETING_GUIDE.md en la raíz del proyecto
          </p>
        </section>
      </div>
    </div>
  );
};

export default AdCreativesPreview;