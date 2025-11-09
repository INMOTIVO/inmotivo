import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, User, Home as HomeIcon, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import HelpCenter from "./HelpCenter";
const HomeMenu = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const handleNavigation = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };
  const handleHelpCenter = () => {
    setIsOpen(false);
    setShowHelpCenter(true);
  };
  return <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
        <div className="px-4 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <div className="flex items-center gap-1.5 md:gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <svg width="36" height="36" viewBox="0 0 180 180" className="md:w-[46px] md:h-[46px] transition-transform hover:scale-105 flex-shrink-0">
                <g transform="translate(20,25)" strokeWidth="8" fill="none">
                  <rect x="0" y="0" width="48" height="90" rx="6" className="stroke-primary" />
                  <rect x="62" y="0" width="48" height="90" rx="6" className="stroke-primary" />
                  <rect x="31" y="25" width="48" height="65" rx="6" className="stroke-accent" />
                </g>
              </svg>
              <span className="text-xl md:text-2xl font-bold text-foreground tracking-tight leading-none pt-0.5">INMOTIVO</span>
            </div>

            {/* Hamburger Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menú">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] z-[200]">
                <SheetHeader>
                  <SheetTitle className="text-left">Menú</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  <Button variant="ghost" className="justify-start text-base h-12" onClick={() => handleNavigation("/auth")}>
                    <User className="h-5 w-5 mr-3" />
                    Iniciar sesión
                  </Button>
                  
                  <Button variant="ghost" className="justify-start text-base h-12" onClick={() => handleNavigation("/auth")}>Publicar inmueble<HomeIcon className="h-5 w-5 mr-3" />
                    Publica tu inmueble
                  </Button>
                  
                  <Button variant="ghost" className="justify-start text-base h-12" onClick={handleHelpCenter}>
                    <HelpCircle className="h-5 w-5 mr-3" />
                    Centro de ayuda
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Help Center Dialog */}
      <HelpCenter open={showHelpCenter} onOpenChange={setShowHelpCenter} />
    </>;
};
export default HomeMenu;