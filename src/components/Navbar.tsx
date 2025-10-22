import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Home, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useRole();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    } else {
      toast.success("Sesión cerrada exitosamente");
      setIsOpen(false);
      navigate("/");
    }
  };

  const handleNavigation = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <svg width="46" height="46" viewBox="0 0 180 180" className="transition-transform hover:scale-105 flex-shrink-0">
              {/* Isotipo M (planta) - Adaptado con colores del design system */}
              <g transform="translate(20,25)" strokeWidth="8" fill="none">
                <rect x="0" y="0" width="48" height="90" rx="6" className="stroke-primary"/>
                <rect x="62" y="0" width="48" height="90" rx="6" className="stroke-primary"/>
                <rect x="31" y="25" width="48" height="65" rx="6" className="stroke-accent"/>
              </g>
            </svg>
            <span className="text-2xl font-bold text-foreground tracking-tight leading-none pt-0.5">INMOTIVO</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="/" className="text-foreground hover:text-primary transition-colors font-medium">
              Home
            </a>
            {user ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(isAdmin ? "/admin" : "/dashboard")}
                >
                  {isAdmin ? (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Dashboard Admin
                    </>
                  ) : (
                    'Mi Dashboard'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/auth")}
              >
                Iniciar Sesión
              </Button>
            )}
          </div>

          {/* Mobile menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 hover:bg-accent/10 rounded-lg transition-colors">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] z-[100]">
              <SheetHeader>
                <SheetTitle className="text-left">Menú</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                <Button
                  variant="ghost"
                  className="justify-start text-base h-12"
                  onClick={() => handleNavigation("/")}
                >
                  <Home className="h-5 w-5 mr-3" />
                  Home
                </Button>
                {user ? (
                  <>
                    <Button
                      variant="ghost"
                      className="justify-start text-base h-12"
                      onClick={() => handleNavigation(isAdmin ? "/admin" : "/dashboard")}
                    >
                      {isAdmin ? (
                        <>
                          <Shield className="h-5 w-5 mr-3" />
                          Dashboard Admin
                        </>
                      ) : (
                        'Mi Dashboard'
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start text-base h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Cerrar Sesión
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    className="justify-start text-base h-12"
                    onClick={() => handleNavigation("/auth")}
                  >
                    Iniciar Sesión
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
