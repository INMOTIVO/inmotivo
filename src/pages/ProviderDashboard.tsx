import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { Plus, Home, MessageCircle, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

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

const ProviderDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProperties();
      fetchMessages();
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

  if (loading || loadingData) {
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Dashboard de Proveedor</h1>
            <p className="text-muted-foreground mt-2">
              Gestiona tus propiedades y mensajes
            </p>
          </div>
          <Button onClick={() => navigate('/create-property')} size="lg">
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
          <TabsList>
            <TabsTrigger value="properties">Mis Propiedades</TabsTrigger>
            <TabsTrigger value="messages">
              Mensajes ({messages.length})
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
        </Tabs>
      </main>
    </div>
  );
};

export default ProviderDashboard;
