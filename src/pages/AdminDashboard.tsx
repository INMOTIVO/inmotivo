import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import PropertiesManagementTable from '@/components/PropertiesManagementTable';
import { Home, MessageCircle, Eye, TrendingUp, Users, Plus, ArrowLeft, BarChart3, Building } from 'lucide-react';
import { toast } from 'sonner';
interface DashboardStats {
  totalProperties: number;
  activeProperties: number;
  totalMessages: number;
  todayVisits: number;
  weeklyVisits: number;
  totalUsers: number;
}
interface RecentProperty {
  id: string;
  title: string;
  city: string;
  status: string;
  created_at: string;
  updated_at: string;
  owner: {
    full_name: string | null;
  };
}
const AdminDashboard = () => {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const {
    isAdmin,
    loading: roleLoading
  } = useRole();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeProperties: 0,
    totalMessages: 0,
    todayVisits: 0,
    weeklyVisits: 0,
    totalUsers: 0
  });
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPropertiesView, setShowPropertiesView] = useState<'all' | 'available' | 'draft' | 'suspended' | null>(null);
  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        toast.error('No tienes permisos de administrador');
        navigate('/dashboard');
      }
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);
  useEffect(() => {
    if (user && isAdmin) {
      fetchDashboardData();
    }
  }, [user, isAdmin]);
  useEffect(() => {
    if (user && isAdmin && !showPropertiesView) {
      fetchDashboardData();
    }
  }, [showPropertiesView, user, isAdmin]);

  // Suscripción en tiempo real a cambios en propiedades
  useEffect(() => {
    if (!user || !isAdmin) return;
    console.log('🔴 Configurando suscripción en tiempo real para propiedades');
    const channel = supabase.channel('properties-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'properties'
    }, payload => {
      console.log('🟢 Cambio detectado en propiedades:', payload);
      // Refetch datos cuando hay cambios en propiedades
      fetchDashboardData();
    }).subscribe(status => {
      console.log('📡 Estado de suscripción:', status);
    });
    return () => {
      console.log('🔴 Cerrando suscripción en tiempo real');
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);
  const fetchDashboardData = async () => {
    try {
      // Obtener estadísticas de propiedades
      const {
        data: properties,
        error: propError
      } = await supabase.from('properties').select('status');
      if (propError) throw propError;
      const totalProperties = properties?.length || 0;
      const activeProperties = properties?.filter(p => p.status === 'available').length || 0;

      // Obtener total de mensajes
      const {
        count: messagesCount,
        error: msgError
      } = await supabase.from('contact_messages').select('*', {
        count: 'exact',
        head: true
      });
      if (msgError) throw msgError;

      // Obtener total de usuarios
      const {
        count: usersCount,
        error: usersError
      } = await supabase.from('profiles').select('*', {
        count: 'exact',
        head: true
      });
      if (usersError) throw usersError;

      // Obtener visitas de hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const {
        count: todayVisitsCount,
        error: todayError
      } = await supabase.from('page_views').select('*', {
        count: 'exact',
        head: true
      }).gte('created_at', today.toISOString());
      if (todayError) throw todayError;

      // Obtener visitas de la última semana
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const {
        count: weeklyVisitsCount,
        error: weeklyError
      } = await supabase.from('page_views').select('*', {
        count: 'exact',
        head: true
      }).gte('created_at', weekAgo.toISOString());
      if (weeklyError) throw weeklyError;

      // Obtener propiedades recientes (actualizadas o creadas)
      const {
        data: recentProps,
        error: recentError
      } = await supabase.from('properties').select(`
          id,
          title,
          city,
          status,
          created_at,
          updated_at,
          profiles!properties_owner_id_fkey(full_name)
        `).order('updated_at', {
        ascending: false
      }).limit(5);
      if (recentError) throw recentError;
      setStats({
        totalProperties,
        activeProperties,
        totalMessages: messagesCount || 0,
        todayVisits: todayVisitsCount || 0,
        weeklyVisits: weeklyVisitsCount || 0,
        totalUsers: usersCount || 0
      });
      setRecentProperties(recentProps?.map(p => ({
        id: p.id,
        title: p.title,
        city: p.city,
        status: p.status,
        created_at: p.created_at,
        updated_at: p.updated_at,
        owner: p.profiles as any
      })) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };
  if (authLoading || roleLoading || loading) {
    return <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <p>Cargando...</p>
        </div>
      </div>;
  }
  if (showPropertiesView) {
    return <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <PropertiesManagementTable filterStatus={showPropertiesView} isAdmin={true} onBack={() => setShowPropertiesView(null)} />
        </main>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Dashboard de Administrador</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Panel de control y métricas de la plataforma
            </p>
          </div>
          <Button onClick={() => navigate('/create-property')} size="lg" className="w-full sm:w-auto">
            <Plus className="mr-2 h-5 w-5" />
            Nueva Propiedad
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowPropertiesView('all')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Propiedades
              </CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProperties}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeProperties} activas
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowPropertiesView('available')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Propiedades Activas
              </CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProperties}</div>
              <p className="text-xs text-muted-foreground">
                Publicadas en el portal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Mensajes
              </CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMessages}</div>
              <p className="text-xs text-muted-foreground">
                Intercambiados en el portal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Visitas Hoy
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayVisits}</div>
              <p className="text-xs text-muted-foreground">
                Visitas al portal hoy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Visitas Esta Semana
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.weeklyVisits}</div>
              <p className="text-xs text-muted-foreground">
                Últimos 7 días
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Usuarios Registrados
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Total en la plataforma
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent" className="text-xs sm:text-sm">
              <BarChart3 className="mr-0 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Actividad </span>Reciente
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">
              <TrendingUp className="mr-0 sm:mr-2 h-4 w-4" />
              Analíticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                
              </CardHeader>
              <CardContent>
                {recentProperties.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">
                    No hay actividad reciente
                  </p> : <div className="space-y-3">
                    {recentProperties.map(property => <div key={property.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate(`/property/${property.id}`)}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{property.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${property.status === 'available' ? 'bg-green-100 text-green-700' : property.status === 'draft' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'}`}>
                              {property.status === 'available' ? 'Activa' : property.status === 'draft' ? 'Borrador' : 'Suspendida'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {property.city} • {property.owner?.full_name || 'Sin nombre'}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          <p>Actualizada: {new Date(property.updated_at).toLocaleDateString()}</p>
                          <p className="text-[10px]">
                            {new Date(property.updated_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>)}
                  </div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Rendimiento</CardTitle>
                <CardDescription>
                  Análisis detallado de la actividad en la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Tasa de Conversión
                      </p>
                      <p className="text-2xl font-bold">
                        {stats.totalMessages > 0 && stats.totalProperties > 0 ? (stats.totalMessages / stats.totalProperties * 100).toFixed(1) : 0}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Mensajes por propiedad
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Propiedades por Usuario
                      </p>
                      <p className="text-2xl font-bold">
                        {stats.totalUsers > 0 ? (stats.totalProperties / stats.totalUsers).toFixed(1) : 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Promedio de publicaciones
                      </p>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      💡 Las métricas de visitas se actualizarán cuando se integre un sistema de analíticas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>;
};
export default AdminDashboard;