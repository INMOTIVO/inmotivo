import { Button } from "@/components/ui/button";
import { Building2, TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const CTASection = () => {
  const navigate = useNavigate();

  const handleDemo = () => {
    navigate('/publicar');
  };

  const handlePlans = () => {
    navigate('/publicar#planes');
  };
  return (
    <section className="py-24 bg-gradient-to-br from-primary via-primary to-blue-600 text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold">
              ¿Eres inmobiliaria o propietario?
            </h2>
            <p className="text-xl md:text-2xl text-white/90">
              Únete a INMOTIVO y llega a miles de clientes potenciales con tecnología de IA
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 py-12">
            <div className="space-y-3">
              <div className="inline-flex p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <Building2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Panel B2B</h3>
              <p className="text-white/80">Gestiona todas tus propiedades en un solo lugar</p>
            </div>
            <div className="space-y-3">
              <div className="inline-flex p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Más Leads</h3>
              <p className="text-white/80">Aumenta tu visibilidad y genera más contactos</p>
            </div>
            <div className="space-y-3">
              <div className="inline-flex p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Analítica</h3>
              <p className="text-white/80">Mide el rendimiento de tus publicaciones</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button 
              size="xl" 
              variant="secondary"
              className="bg-white text-primary hover:bg-white/95 shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:shadow-[0_0_40px_rgba(255,255,255,0.7)] transition-all duration-300 font-semibold"
              onClick={handleDemo}
            >
              Solicitar Demo
            </Button>
            <Button 
              size="xl" 
              variant="secondary"
              className="bg-white text-primary hover:bg-white/95 shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:shadow-[0_0_40px_rgba(255,255,255,0.7)] transition-all duration-300 font-semibold"
              onClick={handlePlans}
            >
              Ver Planes
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
