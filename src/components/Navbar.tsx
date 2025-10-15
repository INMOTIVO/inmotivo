import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold text-foreground">ARRENDO</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-foreground hover:text-primary transition-colors font-medium">
              Buscar
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors font-medium">
              Propiedades
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors font-medium">
              Para Inmobiliarias
            </a>
            <Button variant="outline" size="sm">
              Iniciar Sesión
            </Button>
            <Button size="sm">
              Publicar Propiedad
            </Button>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
