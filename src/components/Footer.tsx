import { MapPin, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold">ARRENDO</span>
            </div>
            <p className="text-background/70">
              La plataforma inteligente de arriendos con IA y geolocalización
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-background/70">
              <li><a href="#" className="hover:text-primary transition-colors">Buscar Propiedades</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cómo Funciona</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Para Inmobiliarias</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-2 text-background/70">
              <li><a href="#" className="hover:text-primary transition-colors">Términos y Condiciones</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Política de Cookies</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contacto</h3>
            <ul className="space-y-3 text-background/70">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Medellín, Colombia</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@arrendo.co" className="hover:text-primary transition-colors">
                  info@arrendo.co
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+573001234567" className="hover:text-primary transition-colors">
                  +57 300 123 4567
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-background/20 text-center text-background/60">
          <p>&copy; 2025 ARRENDO. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
