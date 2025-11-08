import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Home, Shield, Heart, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const isAdminPage = location.pathname === '/admin';

  // Query to get user profile
  const { data: profile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, user_type")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Query to count favorites
  const { data: favoritesCount = 0 } = useQuery({
    queryKey: ["favorites-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("property_favorites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const isOwner = profile?.user_type === 'owner';

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
      <div className="px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-1.5 md:gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <svg width="36" height="36" viewBox="0 0 180 180" className="md:w-[46px] md:h-[46px] transition-transform hover:scale-105 flex-shrink-0">
              {/* Isotipo M (planta) - Adaptado con colores del design system */}
              <g transform="translate(20,25)" strokeWidth="8" fill="none">
                <rect x="0" y="0" width="48" height="90" rx="6" className="stroke-primary"/>
                <rect x="62" y="0" width="48" height="90" rx="6" className="stroke-primary"/>
                <rect x="31" y="25" width="48" height="65" rx="6" className="stroke-accent"/>
              </g>
            </svg>
            <span className="text-xl md:text-2xl font-bold text-foreground tracking-tight leading-none pt-0.5">INMOTIVO</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 ml-auto">
            <a href="/" className="text-foreground hover:text-primary transition-colors font-medium">
              Inicio
            </a>
            {user ? (
              <>
                {profile?.full_name && (
                  <span className="text-sm text-muted-foreground">
                    Hola, <span className="font-semibold text-foreground">{profile.full_name}</span>
                  </span>
                )}
                {!isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/profile")}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Mi Perfil
                  </Button>
                )}
                {(isAdmin || isOwner) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(isAdmin ? "/admin" : "/dashboard")}
                  >
                    {isAdmin ? (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Panel Administrador
                      </>
                    ) : (
                      'Mi Panel'
                    )}
                  </Button>
                )}
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

          {/* Right side - Favorites & Mobile Menu */}
          <div className="flex items-center gap-2">
            {/* Favorites Button - Hidden for admin users */}
            {user && !isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/favorites")}
                className="relative"
                aria-label="Ver favoritos"
              >
                <Heart className="h-5 w-5" />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {favoritesCount}
                  </span>
                )}
              </Button>
            )}

            {/* Mobile menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 hover:bg-accent/10 rounded-lg transition-colors">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
            <SheetContent side="right" className="w-[300px] z-[100]">
              <SheetHeader>
                <SheetTitle className="text-left">
                  {user && profile?.full_name ? (
                    <span>Hola, {profile.full_name}</span>
                  ) : (
                    'Menú'
                  )}
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                <Button
                  variant="ghost"
                  className="justify-start text-base h-12"
                  onClick={() => handleNavigation("/")}
                >
                  <Home className="h-5 w-5 mr-3" />
                  Inicio
                </Button>
                {user ? (
                  <>
                    {!isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          className="justify-start text-base h-12"
                          onClick={() => handleNavigation("/profile")}
                        >
                          <User className="h-5 w-5 mr-3" />
                          Mi Perfil
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start text-base h-12"
                          onClick={() => handleNavigation("/favorites")}
                        >
                          <Heart className="h-5 w-5 mr-3" />
                          Favoritos
                        </Button>
                      </>
                    )}
                    {(isAdmin || isOwner) && (
                      <Button
                        variant="ghost"
                        className="justify-start text-base h-12"
                        onClick={() => handleNavigation(isAdmin ? "/admin" : "/dashboard")}
                      >
                        {isAdmin ? (
                          <>
                            <Shield className="h-5 w-5 mr-3" />
                            Panel Administrador
                          </>
                        ) : (
                          'Mi Panel'
                        )}
                      </Button>
                    )}
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
      </div>
    </nav>
  );
};

export default Navbar;
