import { Mail, Phone, Instagram, Facebook } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  return <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto mb-12">
          {/* Brand - Centered and larger */}
          <div className="space-y-6 text-center md:text-left">
            <div 
              className="flex items-center gap-3 cursor-pointer justify-center md:justify-start"
              onClick={() => navigate("/")}
            >
              <svg width="56" height="56" viewBox="0 0 180 180" className="flex-shrink-0 transition-transform hover:scale-105">
                <g transform="translate(20,25)" strokeWidth="8" fill="none">
                  <rect x="0" y="0" width="48" height="90" rx="6" className="stroke-primary" />
                  <rect x="62" y="0" width="48" height="90" rx="6" className="stroke-primary" />
                  <rect x="31" y="25" width="48" height="65" rx="6" className="stroke-accent" />
                </g>
              </svg>
              <span className="text-3xl font-bold">INMOTIVO</span>
            </div>
            <p className="text-background/70 text-lg leading-relaxed">
              La plataforma inteligente de arriendos con IA y geolocalización en tiempo real
            </p>
          </div>

          {/* Contact - Expanded */}
          <div className="space-y-6 text-center md:text-left">
            <h3 className="font-semibold text-2xl mb-6">Contacto</h3>
            <ul className="space-y-4 text-background/70">
              <li className="flex items-center gap-3 justify-center md:justify-start">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <a href="mailto:info@inmotivo.com" className="hover:text-primary transition-colors text-lg">
                  info@inmotivo.com
                </a>
              </li>
              <li className="flex items-center gap-3 justify-center md:justify-start">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <a href="tel:+573001234567" className="hover:text-primary transition-colors text-lg">
                  +57 300 123 4567
                </a>
              </li>
              <li className="flex items-center gap-4 justify-center md:justify-start pt-2">
                <a href="https://instagram.com/inmotivo" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors hover:scale-110 transform duration-200">
                  <Instagram className="h-6 w-6" />
                </a>
                <a href="https://facebook.com/inmotivo" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors hover:scale-110 transform duration-200">
                  <Facebook className="h-6 w-6" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-background/20 text-center text-background/60">
          <p>&copy; 2025 INMOTIVO. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>;
};
export default Footer;