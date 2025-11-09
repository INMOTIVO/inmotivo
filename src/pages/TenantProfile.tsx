import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Mail, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TenantProfile = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && !roleLoading && isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, loading, roleLoading, navigate]);

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user!.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch favorites
  const { data: favorites, isLoading: loadingFavorites } = useQuery({
    queryKey: ['tenant-favorites', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_favorites')
        .select(`
          id,
          created_at,
          property:properties (
            id,
            title,
            address,
            city,
            price,
            currency,
            bedrooms,
            bathrooms,
            area_m2,
            images,
            property_type
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch contacted properties (messages sent)
  const { data: contactedProperties, isLoading: loadingContacted } = useQuery({
    queryKey: ['tenant-contacted', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select(`
          id,
          message,
          created_at,
          is_read,
          property:properties (
            id,
            title,
            address,
            city,
            price,
            currency,
            images
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch replies received
  const { data: repliesReceived, isLoading: loadingReplies } = useQuery({
    queryKey: ['tenant-replies', user?.id],
    queryFn: async () => {
      const { data: messages, error: messagesError } = await supabase
        .from('contact_messages')
        .select('id')
        .eq('user_id', user!.id);

      if (messagesError) throw messagesError;
      if (!messages || messages.length === 0) return [];

      const messageIds = messages.map(m => m.id);

      const { data, error } = await supabase
        .from('message_replies')
        .select(`
          id,
          reply_text,
          created_at,
          contact_message:contact_messages (
            id,
            message,
            property:properties (
              id,
              title,
              images
            )
          ),
          replier:profiles!message_replies_replied_by_fkey (
            full_name
          )
        `)
        .in('contact_message_id', messageIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">
      <p>Cargando...</p>
    </div>;
  }

  const formatPrice = (price: number, currency: string = 'COP') => {
    if (currency === 'COP') {
      return `$${price.toLocaleString('es-CO')}`;
    }
    return `${currency} ${price.toLocaleString('es-CO')}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Mi Perfil</h1>
              <p className="text-muted-foreground">
                Gestiona tus propiedades favoritas y mensajes
              </p>
            </div>
            {profile?.full_name && (
              <p className="text-lg text-muted-foreground">
                Hola, <span className="font-semibold text-foreground">{profile.full_name.split(' ')[0]}</span>
              </p>
            )}
          </div>
        </div>

        <Tabs defaultValue="favorites" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Favoritos</span>
              {favorites && favorites.length > 0 && (
                <Badge variant="secondary">{favorites.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="contacted" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Contactados</span>
              {contactedProperties && contactedProperties.length > 0 && (
                <Badge variant="secondary">{contactedProperties.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="replies" className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Respuestas</span>
              {repliesReceived && repliesReceived.length > 0 && (
                <Badge variant="secondary">{repliesReceived.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-4">
            {loadingFavorites ? (
              <p className="text-center py-8">Cargando favoritos...</p>
            ) : favorites && favorites.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {favorites.map((fav: any) => (
                  <Card 
                    key={fav.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/property/${fav.property.id}`)}
                  >
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                      <img
                        src={fav.property.images?.[0] || '/placeholder.svg'}
                        alt={fav.property.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-1">
                        {fav.property.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {fav.property.city}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary mb-2">
                        {formatPrice(fav.property.price, fav.property.currency)}
                      </p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {fav.property.bedrooms > 0 && (
                          <span>{fav.property.bedrooms} hab</span>
                        )}
                        {fav.property.bathrooms > 0 && (
                          <span>{fav.property.bathrooms} baños</span>
                        )}
                        {fav.property.area_m2 && (
                          <span>{fav.property.area_m2} m²</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    No tienes propiedades favoritas
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Explora propiedades y guarda las que te gusten
                  </p>
                  <Button onClick={() => navigate('/')}>
                    Buscar propiedades
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Contacted Tab */}
          <TabsContent value="contacted" className="space-y-4">
            {loadingContacted ? (
              <p className="text-center py-8">Cargando propiedades contactadas...</p>
            ) : contactedProperties && contactedProperties.length > 0 ? (
              <div className="space-y-4">
                {contactedProperties.map((contact: any) => (
                  <Card key={contact.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle 
                            className="text-lg cursor-pointer hover:text-primary transition-colors"
                            onClick={() => navigate(`/property/${contact.property.id}`)}
                          >
                            {contact.property.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {contact.property.city}
                          </CardDescription>
                        </div>
                        {!contact.is_read && (
                          <Badge variant="secondary">Pendiente</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(contact.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">Tu mensaje:</p>
                        <p className="text-sm">{contact.message}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/property/${contact.property.id}`)}
                      >
                        Ver propiedad
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    No has contactado propiedades aún
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Envía un mensaje a los propietarios de las propiedades que te interesan
                  </p>
                  <Button onClick={() => navigate('/')}>
                    Buscar propiedades
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Replies Tab */}
          <TabsContent value="replies" className="space-y-4">
            {loadingReplies ? (
              <p className="text-center py-8">Cargando respuestas...</p>
            ) : repliesReceived && repliesReceived.length > 0 ? (
              <div className="space-y-4">
                {repliesReceived.map((reply: any) => (
                  <Card key={reply.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle 
                            className="text-lg cursor-pointer hover:text-primary transition-colors"
                            onClick={() => navigate(`/property/${reply.contact_message.property.id}`)}
                          >
                            {reply.contact_message.property.title}
                          </CardTitle>
                          <CardDescription>
                            Respuesta de {reply.replier?.full_name || 'Propietario'}
                          </CardDescription>
                        </div>
                        <Badge>Nueva</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(reply.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </div>
                      <div className="space-y-2">
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Tu mensaje:</p>
                          <p className="text-sm">{reply.contact_message.message}</p>
                        </div>
                        <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                          <p className="text-xs font-medium text-primary mb-1">Respuesta:</p>
                          <p className="text-sm">{reply.reply_text}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/property/${reply.contact_message.property.id}`)}
                      >
                        Ver propiedad
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    No tienes respuestas aún
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Cuando los propietarios respondan tus mensajes, aparecerán aquí
                  </p>
                  <Button onClick={() => navigate('/')}>
                    Buscar propiedades
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default TenantProfile;
