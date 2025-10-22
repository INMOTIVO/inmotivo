import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import { Plus, Home, MessageCircle, Edit, Trash2, Eye, User, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface Property {
  id: string;
  title: string;
  price: number;
  currency: string;
  status: string;
  property_type: string;
  images: unknown;
  city: string;
  neighborhood: string;
  created_at: string;
}

interface ContactMessage {
  id: string;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  message: string;
  created_at: string;
  property_id: string;
  properties: {
    title: string;
  };
}

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
}

const profileSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  phone: z.string()
    .transform(val => {
      if (!val) return '';
      // Eliminar todos los caracteres no numéricos
      const digits = val.replace(/\D/g, '');
      // Si comienza con 57, usar esos dígitos; si no, agregar 57
      const withCountryCode = digits.startsWith('57') ? digits : '57' + digits;
      // Validar que tenga 12 dígitos en total (57 + 10 dígitos)
      if (withCountryCode.length !== 12) {
        throw new z.ZodError([{
          code: 'custom',
          path: ['phone'],
          message: 'El teléfono debe tener 10 dígitos'
        }]);
      }
      // Formatear: +57 XXX XXX XXXX
      return `+${withCountryCode.slice(0, 2)} ${withCountryCode.slice(2, 5)} ${withCountryCode.slice(5, 8)} ${withCountryCode.slice(8)}`;
    })
    .optional()
    .or(z.literal('')),
});

const formatPhoneInput = (value: string): string => {
  if (!value) return '';
  // Eliminar todos los caracteres no numéricos
  let digits = value.replace(/\D/g, '');
  
  // Si empieza con 57, mantenerlo; si no, agregarlo
  if (!digits.startsWith('57')) {
    digits = '57' + digits;
  }
  
  // Limitar a 12 dígitos (57 + 10)
  digits = digits.slice(0, 12);
  
  // Formatear mientras escribe
  if (digits.length <= 2) {
    return `+${digits}`;
  } else if (digits.length <= 5) {
    return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
  } else if (digits.length <= 8) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  } else {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
};

const ProviderDashboard = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user) {
        navigate('/auth');
      } else if (isAdmin) {
        navigate('/admin');
      }
    }
  }, [user, isAdmin, loading, roleLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProperties();
      fetchMessages();
      fetchProfile();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Error al cargar propiedades');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select(`
          *,
          properties!inner(title, owner_id)
        `)
        .eq('properties.owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile(data);
        form.reset({
          full_name: data.full_name || '',
          phone: data.phone || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const onSubmitProfile = async (values: z.infer<typeof profileSchema>) => {
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: values.full_name,
          phone: values.phone || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      toast.success('Perfil actualizado correctamente');
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta propiedad?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Propiedad eliminada');
      fetchProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Error al eliminar propiedad');
    }
  };

  if (loading || roleLoading || loadingData) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  const propertyTypeLabels: Record<string, string> = {
    apartment: 'Apartamento',
    house: 'Casa',
    studio: 'Apartaestudio',
    commercial: 'Local Comercial',
    warehouse: 'Bodega',
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <p className="text-base sm:text-lg text-muted-foreground mb-2">
              Bienvenido, <span className="text-foreground font-semibold">{profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuario'}</span>
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Dashboard de Proveedor</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Gestiona tus propiedades y mensajes
            </p>
          </div>
          <Button onClick={() => navigate('/create-property')} size="lg" className="w-full sm:w-auto">
            <Plus className="mr-2 h-5 w-5" />
            Nueva Propiedad
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Propiedades Activas
              </CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {properties.filter((p) => p.status === 'available').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Propiedades
              </CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{properties.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Mensajes Recibidos
              </CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messages.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="properties" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Mis </span>Propiedades
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-xs sm:text-sm">
              Mensajes ({messages.length})
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs sm:text-sm">
              <User className="mr-0 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Mi </span>Perfil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-4">
            {properties.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Aún no has publicado ninguna propiedad
                  </p>
                  <Button onClick={() => navigate('/create-property')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Publicar Primera Propiedad
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => {
                  const images = property.images as string[];
                  const priceFormatted = new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: property.currency,
                    minimumFractionDigits: 0,
                  }).format(property.price);

                  return (
                    <Card key={property.id} className="overflow-hidden">
                      {images[0] && (
                        <img
                          src={images[0]}
                          alt={property.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-lg line-clamp-1">
                            {property.title}
                          </h3>
                          <Badge
                            variant={
                              property.status === 'available'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {property.status === 'available'
                              ? 'Activa'
                              : 'Borrador'}
                          </Badge>
                        </div>

                        <p className="text-primary font-bold text-lg">
                          {priceFormatted}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {propertyTypeLabels[property.property_type]} •{' '}
                          {property.neighborhood}, {property.city}
                        </p>

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => navigate(`/property/${property.id}`)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() =>
                              navigate(`/edit-property/${property.id}`)
                            }
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteProperty(property.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            {messages.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">
                    No has recibido mensajes aún
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <Card key={message.id}>
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{message.sender_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {message.sender_email}
                            {message.sender_phone &&
                              ` • ${message.sender_phone}`}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {new Date(message.created_at).toLocaleDateString()}
                        </Badge>
                      </div>

                      <p className="text-sm">
                        Propiedad:{' '}
                        <span className="font-medium">
                          {message.properties.title}
                        </span>
                      </p>

                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">
                          {message.message}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href={`mailto:${message.sender_email}`}>
                            Responder por Email
                          </a>
                        </Button>
                        {message.sender_phone && (
                          <Button size="sm" variant="outline" asChild>
                            <a
                              href={`https://wa.me/${message.sender_phone.replace(
                                /\D/g,
                                ''
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              WhatsApp
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Actualiza tus datos de contacto. Esta información será visible para los clientes interesados en tus propiedades.
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          El correo no se puede modificar
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre Completo *</FormLabel>
                            <FormControl>
                              <Input placeholder="Juan Pérez" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono Celular</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+57 300 123 4567"
                                value={field.value}
                                onChange={(e) => {
                                  const formatted = formatPhoneInput(e.target.value);
                                  field.onChange(formatted);
                                }}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Escribe el número y se formateará automáticamente
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" disabled={savingProfile}>
                      {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProviderDashboard;
