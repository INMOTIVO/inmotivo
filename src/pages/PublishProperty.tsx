import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Building2, TrendingUp, Users, Zap, Shield, BarChart3, CheckCircle, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PublishProperty = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: TrendingUp,
      title: "Más Visibilidad",
      description: "Tus propiedades vistas por miles de usuarios activos buscando arriendos"
    },
    {
      icon: Users,
      title: "Leads Calificados",
      description: "Contacto directo con clientes interesados y pre-filtrados por IA"
    },
    {
      icon: Zap,
      title: "Publicación Rápida",
      description: "Sube tus propiedades en minutos con nuestro sistema intuitivo"
    },
    {
      icon: Shield,
      title: "Verificación",
      description: "Badge de verificación que genera confianza en tus clientes"
    },
    {
      icon: BarChart3,
      title: "Analítica en Tiempo Real",
      description: "Mide visitas, contactos y rendimiento de cada propiedad"
    },
    {
      icon: Building2,
      title: "Panel B2B Completo",
      description: "Gestiona todo tu portafolio desde un solo lugar"
    }
  ];

  const plans = [
    {
      name: "Básico",
      price: "Gratis",
      features: [
        "Hasta 3 propiedades activas",
        "Publicación básica con fotos",
        "Visible en búsquedas",
        "Estadísticas básicas"
      ],
      cta: "Comenzar Gratis",
      highlighted: false
    },
    {
      name: "Profesional",
      price: "$99.000/mes",
      features: [
        "Propiedades ilimitadas",
        "Prioridad en búsquedas",
        "Badge de verificación",
        "Analítica avanzada",
        "Tours virtuales 360°",
        "Soporte prioritario"
      ],
      cta: "Prueba 30 días gratis",
      highlighted: true
    },
    {
      name: "Inmobiliaria",
      price: "Personalizado",
      features: [
        "Todo lo del plan Profesional",
        "Multi-usuario y equipos",
        "API de integración",
        "CRM integrado",
        "Account manager dedicado",
        "Capacitación personalizada"
      ],
      cta: "Contactar Ventas",
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              Publica tus Propiedades
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Llega a miles de clientes potenciales con tecnología de IA. 
              La forma más inteligente de publicar y gestionar arriendos en Medellín.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => navigate('/auth')}
              >
                Publicar Ahora
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6"
                onClick={() => {
                  const element = document.getElementById('planes');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Ver Planes
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-2">50K+</div>
                <div className="text-sm text-muted-foreground">Búsquedas/mes</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-2">85%</div>
                <div className="text-sm text-muted-foreground">Tasa de contacto</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-2">48h</div>
                <div className="text-sm text-muted-foreground">Tiempo promedio</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-2">500+</div>
                <div className="text-sm text-muted-foreground">Propietarios activos</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            ¿Por qué publicar en ARRENDO?
          </h2>
          <p className="text-xl text-center text-muted-foreground mb-16">
            La plataforma inteligente que conecta tus propiedades con los inquilinos ideales
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="hover:shadow-xl transition-all duration-300">
                  <CardContent className="pt-6 space-y-4">
                    <div className="inline-flex p-3 rounded-xl bg-primary/10">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Publicar es muy fácil
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                1
              </div>
              <h3 className="text-2xl font-semibold">Crea tu cuenta</h3>
              <p className="text-muted-foreground">
                Regístrate gratis y accede al panel de control
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                2
              </div>
              <h3 className="text-2xl font-semibold">Sube tu propiedad</h3>
              <p className="text-muted-foreground">
                Agrega fotos, descripción y detalles en minutos
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                3
              </div>
              <h3 className="text-2xl font-semibold">Recibe contactos</h3>
              <p className="text-muted-foreground">
                Empieza a recibir leads calificados al instante
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planes" className="py-20 px-4 bg-card">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Planes que se adaptan a ti
          </h2>
          <p className="text-xl text-center text-muted-foreground mb-16">
            Desde propietarios individuales hasta grandes inmobiliarias
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.highlighted ? 'border-primary border-2 shadow-xl scale-105' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Más Popular
                  </div>
                )}
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="text-3xl font-bold text-primary">{plan.price}</div>
                  </div>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    size="lg"
                    onClick={() => navigate('/auth')}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-4xl text-center relative z-10 space-y-8">
          <h2 className="text-4xl md:text-6xl font-bold">
            Comienza a publicar hoy mismo
          </h2>
          <p className="text-xl md:text-2xl opacity-90">
            Únete a cientos de propietarios que ya están generando leads con ARRENDO
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8 py-6"
              onClick={() => navigate('/auth')}
            >
              Publicar Gratis
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6 border-white/50 text-white hover:bg-white/10"
            >
              <Phone className="mr-2 h-5 w-5" />
              Llamar ahora
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PublishProperty;