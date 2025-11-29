import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useProfileTypes } from "@/hooks/useProfileTypes";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, AlertCircle } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";

const signInSchema = z.object({
  email: z.string().email("Email inválido").max(255, "Email demasiado largo"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(100, "Contraseña demasiado larga"),
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(1, "El nombre es requerido").max(100, "Nombre demasiado largo"),
  email: z.string().email("Email inválido").max(255, "Email demasiado largo"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(100, "Contraseña demasiado larga"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const newPasswordSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(100, "Contraseña demasiado larga"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, signIn, signUp, resetPassword, isPasswordRecovery, updatePassword } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const { isOwner, isTenant, isBuyer, setPendingType, loading: profileTypesLoading } = useProfileTypes();
  const [loading, setLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const defaultTab = searchParams.get('tab') || 'signin';
  
  // State for existing user flow
  const [showExistingUserAlert, setShowExistingUserAlert] = useState(false);
  const [pendingUserType, setPendingUserType] = useState<"owner" | "tenant" | "buyer" | null>(null);

  // State for new password form (password recovery)
  const [newPasswordData, setNewPasswordData] = useState({
    password: "",
    confirmPassword: "",
  });

  // Redirect logged-in users based on their profile types
  // BUT NOT if they are in password recovery mode
  useEffect(() => {
    const redirectUser = async () => {
      // Don't redirect if in password recovery mode or still loading
      if (authLoading || roleLoading || profileTypesLoading || !user || isPasswordRecovery) return;

      // Check if user is admin
      if (isAdmin) {
        navigate('/admin');
        return;
      }

      // Redirect based on profile types (prioritize owner)
      if (isOwner) {
        navigate('/dashboard');
      } else {
        navigate('/profile');
      }
    };

    redirectUser();
  }, [user, authLoading, roleLoading, profileTypesLoading, isAdmin, isOwner, navigate, isPasswordRecovery]);

  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });

  const [signUpData, setSignUpData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "tenant" as "owner" | "tenant" | "buyer",
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const result = signInSchema.safeParse(signInData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    
    setLoading(true);

    const { error } = await signIn(signInData.email, signInData.password);

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success("¡Sesión iniciada exitosamente!");
      // The useEffect will handle redirection based on profile types
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const result = signUpSchema.safeParse(signUpData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setLoading(true);

    const { error } = await signUp(
      signUpData.email,
      signUpData.password,
      signUpData.fullName,
      signUpData.userType
    );

    if (error) {
      // Check if user already exists
      if (error.message.includes("already registered") || 
          error.message.includes("User already registered") ||
          error.message.includes("already been registered")) {
        // Show alert to login and add role
        setShowExistingUserAlert(true);
        setPendingUserType(signUpData.userType);
        // Pre-fill sign-in email
        setSignInData(prev => ({ ...prev, email: signUpData.email }));
        toast.info("Este correo ya tiene una cuenta. Inicia sesión para agregar este rol.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("¡Cuenta creada exitosamente!");
      // Redirect based on user type
      if (signUpData.userType === "owner") {
        navigate("/dashboard");
      } else {
        navigate("/profile");
      }
    }

    setLoading(false);
  };

  const handleLoginToAddRole = () => {
    if (pendingUserType) {
      // Store the pending type in sessionStorage for after login
      setPendingType(pendingUserType);
    }
    setShowExistingUserAlert(false);
    // Switch to sign-in tab programmatically
    const signinTab = document.querySelector('[value="signin"]') as HTMLButtonElement;
    if (signinTab) signinTab.click();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailSchema = z.string().email("Email inválido");
    const result = emailSchema.safeParse(resetEmail);
    
    if (!result.success) {
      toast.error("Por favor ingresa un email válido");
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(resetEmail);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Se ha enviado un link de recuperación a tu correo");
      setResetDialogOpen(false);
      setResetEmail("");
    }

    setLoading(false);
  };

  // Handler for updating password after recovery
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const result = newPasswordSchema.safeParse(newPasswordData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    
    setLoading(true);
    const { error } = await updatePassword(newPasswordData.password);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("¡Contraseña actualizada exitosamente!");
      setNewPasswordData({ password: "", confirmPassword: "" });
      // After password update, the useEffect will handle redirection
    }

    setLoading(false);
  };

  // If in password recovery mode, show the new password form
  if (isPasswordRecovery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Establecer nueva contraseña</CardTitle>
              <CardDescription>
                Ingresa tu nueva contraseña para completar la recuperación de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva contraseña</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPasswordData.password}
                    onChange={(e) => setNewPasswordData({
                      ...newPasswordData, 
                      password: e.target.value
                    })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirmar contraseña</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="Repite tu nueva contraseña"
                    value={newPasswordData.confirmPassword}
                    onChange={(e) => setNewPasswordData({
                      ...newPasswordData, 
                      confirmPassword: e.target.value
                    })}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Actualizando..." : "Actualizar contraseña"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="default"
          size="icon"
          onClick={() => navigate("/")}
          className="mb-4 rounded-full w-12 h-12 shadow-xl bg-primary hover:bg-primary/90"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <svg width="60" height="60" viewBox="0 0 180 180" className="transition-transform">
                {/* Isotipo M (planta) - Logo oficial INMOTIVO */}
                <g transform="translate(20,25)" strokeWidth="8" fill="none">
                  <rect x="0" y="0" width="48" height="90" rx="6" className="stroke-primary"/>
                  <rect x="62" y="0" width="48" height="90" rx="6" className="stroke-primary"/>
                  <rect x="31" y="25" width="48" height="65" rx="6" className="stroke-accent"/>
                </g>
              </svg>
            </div>
            <CardTitle className="text-2xl">Bienvenido a INMOTIVO</CardTitle>
            <CardDescription>
              Inicia sesión o crea una cuenta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder=""
                      value={signInData.email}
                      onChange={(e) =>
                        setSignInData({ ...signInData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Contraseña</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder=""
                      value={signInData.password}
                      onChange={(e) =>
                        setSignInData({ ...signInData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Cargando..." : "Iniciar Sesión"}
                  </Button>
                  
                  <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="link" className="w-full text-sm mt-2">
                        ¿Olvidaste tu contraseña?
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Recuperar contraseña</DialogTitle>
                        <DialogDescription>
                          Ingresa tu correo electrónico y te enviaremos un link para restablecer tu contraseña.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-email">Email</Label>
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="tu@email.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? "Enviando..." : "Enviar link de recuperación"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                {showExistingUserAlert && (
                  <Alert className="mb-4 border-amber-500 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <p className="font-medium mb-2">Este correo ya tiene una cuenta</p>
                      <p className="text-sm mb-3">
                        Puedes iniciar sesión para agregar el rol de{" "}
                        <strong>
                          {pendingUserType === "owner" ? "Propietario" : 
                           pendingUserType === "buyer" ? "Comprador" : "Arrendatario"}
                        </strong>{" "}
                        a tu cuenta existente.
                      </p>
                      <Button 
                        size="sm" 
                        onClick={handleLoginToAddRole}
                        className="w-full"
                      >
                        Iniciar sesión y agregar rol
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nombre completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder=""
                      value={signUpData.fullName}
                      onChange={(e) =>
                        setSignUpData({ ...signUpData, fullName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-usertype">Tipo de usuario</Label>
                    <select
                      id="signup-usertype"
                      value={signUpData.userType}
                      onChange={(e) => {
                        setSignUpData({ ...signUpData, userType: e.target.value as "owner" | "tenant" | "buyer" });
                        setShowExistingUserAlert(false); // Hide alert when changing type
                      }}
                      className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                      required
                    >
                      <option value="tenant">Arrendatario</option>
                      <option value="buyer">Comprador</option>
                      <option value="owner">Propietario</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder=""
                      value={signUpData.email}
                      onChange={(e) =>
                        setSignUpData({ ...signUpData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder=""
                      value={signUpData.password}
                      onChange={(e) =>
                        setSignUpData({ ...signUpData, password: e.target.value })
                      }
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirmar contraseña</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder=""
                      value={signUpData.confirmPassword}
                      onChange={(e) =>
                        setSignUpData({
                          ...signUpData,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Cargando..." : "Crear Cuenta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
