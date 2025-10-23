import { Mail, Phone, Instagram, Facebook } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  return <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <svg width="46" height="46" viewBox="0 0 180 180" className="flex-shrink-0 transition-transform hover:scale-105">
                <g transform="translate(20,25)" strokeWidth="8" fill="none">
                  <rect x="0" y="0" width="48" height="90" rx="6" className="stroke-primary" />
                  <rect x="62" y="0" width="48" height="90" rx="6" className="stroke-primary" />
                  <rect x="31" y="25" width="48" height="65" rx="6" className="stroke-accent" />
                </g>
              </svg>
              <span className="text-2xl font-bold">INMOTIVO</span>
            </div>
            <p className="text-background/70">La plataforma inteligente 
de arriendos con IA y geolocalización</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-background/70">
              <li><a href="/docs/buscar-propiedades.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Buscar Propiedades</a></li>
              <li><a href="/docs/como-funciona.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Cómo Funciona</a></li>
              <li><a href="/docs/para-inmobiliarias.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Para Inmobiliarias</a></li>
              <li><a href="/docs/blog.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-2 text-background/70">
              <li><a href="/docs/terminos-condiciones.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Términos y Condiciones</a></li>
              <li><a href="/docs/politica-privacidad.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Política de Privacidad</a></li>
              <li><a href="/docs/politica-cookies.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Política de Cookies</a></li>
              <li><a href="/docs/faq.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contacto</h3>
            <ul className="space-y-3 text-background/70">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@inmotivo.com" className="hover:text-primary transition-colors">
                  info@inmotivo.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+573001234567" className="hover:text-primary transition-colors">
                  +57 300 123 4567
                </a>
              </li>
              <li className="flex items-center gap-3">
                <a href="https://instagram.com/inmotivo" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://facebook.com/inmotivo" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  <Facebook className="h-5 w-5" />
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