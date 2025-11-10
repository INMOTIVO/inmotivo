import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, User, Home as HomeIcon, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import HelpCenter from "./HelpCenter";
const HomeMenu = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [userProfile, setUserProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setUserProfile(null);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (data) {
        setUserProfile(data);
      }
    };

    fetchUserProfile();
  }, [user]);
  const handleNavigation = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };
  const handleHelpCenter = () => {
    setIsOpen(false);
    setShowHelpCenter(true);
  };

  const handleAvatarClick = async () => {
    if (isAdmin) {
      navigate('/admin');
    } else {
      // Check user type from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user?.id)
        .single();

      if (profile?.user_type === 'owner') {
        navigate('/dashboard');
      } else {
        navigate('/profile');
      }
    }
  };

  const getInitials = (fullName?: string) => {
    if (!fullName) return "U";
    const names = fullName.trim().split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
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

            {/* Hamburger Menu with Avatar */}
            <div className="flex items-center gap-3">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-full shadow-sm hover:bg-accent hover:border-primary transition-colors" aria-label="Abrir menú">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              <SheetContent side="right" className="w-[300px] z-[200]">
                <SheetHeader>
                  <SheetTitle className="text-left">Menú</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  {user ? (
                    <div 
                      className="px-4 py-3 rounded-lg bg-accent/30 border border-border cursor-pointer hover:bg-accent/50 transition-colors" 
                      onClick={handleAvatarClick}
                    >
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Sesión iniciada</p>
                          {userProfile?.full_name && (
                            <p className="text-xs text-muted-foreground">{userProfile.full_name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button variant="ghost" className="justify-start text-base h-12" onClick={() => handleNavigation("/auth")}>
                      <User className="h-5 w-5 mr-3" />
                      Iniciar sesión
                    </Button>
                  )}
                  
                  <Button variant="ghost" className="justify-start text-base h-12" onClick={() => handleNavigation("/auth?tab=signup")}>
                    <HomeIcon className="h-5 w-5 mr-3" />
                    Publicar inmueble
                  </Button>
                  
                  <Button variant="ghost" className="justify-start text-base h-12" onClick={handleHelpCenter}>
                    <HelpCircle className="h-5 w-5 mr-3" />
                    Centro de ayuda
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            {user && (
              <Avatar className="h-10 w-10 cursor-pointer border-2 border-border hover:border-primary transition-colors shadow-sm" onClick={handleAvatarClick}>
                <AvatarImage src={userProfile?.avatar_url} alt={userProfile?.full_name || "Usuario"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {getInitials(userProfile?.full_name)}
                </AvatarFallback>
              </Avatar>
            )}
            </div>
          </div>
        </div>
      </nav>

      {/* Help Center Dialog */}
      <HelpCenter open={showHelpCenter} onOpenChange={setShowHelpCenter} />
    </>;
};
export default HomeMenu;