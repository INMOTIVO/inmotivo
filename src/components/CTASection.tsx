import { Button } from "@/components/ui/button";
import { Building2, TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
const CTASection = () => {
  const navigate = useNavigate();
  const handleContact = () => {
    window.location.href = 'mailto:contacto@inmotivo.com';
  };
  return <section className="py-12 md:py-16 bg-gradient-to-br from-primary via-primary to-blue-600 text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl md:text-4xl font-bold">
              ¿Eres inmobiliaria o propietario?
            </h2>
            <p className="text-base md:text-xl text-white/90">
              Únete a INMOTIVO y llega a miles de clientes potenciales con tecnología de IA
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-6 py-6 md:py-8">
            <div className="space-y-2 md:space-y-3">
              <div className="inline-flex p-2 md:p-4 rounded-lg md:rounded-xl bg-white/10 backdrop-blur-sm">
                <Building2 className="h-5 w-5 md:h-8 md:w-8" />
              </div>
              <h3 className="text-sm md:text-xl font-semibold">Panel B2B</h3>
              <p className="text-xs md:text-base text-white/80 leading-tight">Gestiona todas tus propiedades en un solo lugar</p>
            </div>
            <div className="space-y-2 md:space-y-3">
              <div className="inline-flex p-2 md:p-4 rounded-lg md:rounded-xl bg-white/10 backdrop-blur-sm">
                <TrendingUp className="h-5 w-5 md:h-8 md:w-8" />
              </div>
              <h3 className="text-sm md:text-xl font-semibold">Más Leads</h3>
              <p className="text-xs md:text-base text-white/80 leading-tight">Aumenta tu visibilidad y genera más contactos</p>
            </div>
            <div className="space-y-2 md:space-y-3">
              <div className="inline-flex p-2 md:p-4 rounded-lg md:rounded-xl bg-white/10 backdrop-blur-sm">
                <Users className="h-5 w-5 md:h-8 md:w-8" />
              </div>
              <h3 className="text-sm md:text-xl font-semibold">Analítica</h3>
              <p className="text-xs md:text-base text-white/80 leading-tight">Mide el rendimiento de tus publicaciones</p>
            </div>
          </div>

          <div className="flex justify-center">
            <Button size="xl" variant="secondary" className="bg-white text-primary hover:bg-white/95 shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:shadow-[0_0_40px_rgba(255,255,255,0.7)] transition-all duration-300 font-semibold" onClick={handleContact}>Publicar inmueble</Button>
          </div>
        </div>
      </div>
    </section>;
};
export default CTASection;