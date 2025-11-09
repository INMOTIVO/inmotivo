import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, LogIn, Home as HomeIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
        <div className="px-4 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Menu hamburguesa */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button 
                  className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                  aria-label="Abrir menú"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] z-[200]">
                <SheetHeader>
                  <SheetTitle className="text-left">Menú</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  <Button
                    variant="ghost"
                    className="justify-start text-base h-12"
                    onClick={() => handleNavigation("/auth")}
                  >
                    <LogIn className="h-5 w-5 mr-3" />
                    Iniciar sesión
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start text-base h-12"
                    onClick={() => handleNavigation("/auth?mode=register")}
                  >
                    <HomeIcon className="h-5 w-5 mr-3" />
                    Publica tu inmueble
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start text-base h-12"
                    onClick={handleHelpCenter}
                  >
                    <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Centro de ayuda
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo centrado */}
            <div 
              className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 md:gap-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <svg width="36" height="36" viewBox="0 0 180 180" className="md:w-[46px] md:h-[46px] transition-transform hover:scale-105 flex-shrink-0">
                <g transform="translate(20,25)" strokeWidth="8" fill="none">
                  <rect x="0" y="0" width="48" height="90" rx="6" className="stroke-primary"/>
                  <rect x="62" y="0" width="48" height="90" rx="6" className="stroke-primary"/>
                  <rect x="31" y="25" width="48" height="65" rx="6" className="stroke-accent"/>
                </g>
              </svg>
              <span className="text-xl md:text-2xl font-bold text-foreground tracking-tight leading-none pt-0.5">INMOTIVO</span>
            </div>

            {/* Espacio vacío para balance */}
            <div className="w-[48px]"></div>
          </div>
        </div>
      </nav>

      {/* Help Center Dialog */}
      <HelpCenter open={showHelpCenter} onOpenChange={setShowHelpCenter} />
    </>
  );
};

export default HomeMenu;
