import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';
import PropertiesManagementTable from '@/components/PropertiesManagementTable';
import { 
  Home, 
  MessageCircle, 
  Eye, 
  TrendingUp, 
  Users, 
  Plus,
  ArrowLeft,
  BarChart3,
  Building,
  Pencil,
  Trash2,
  Ban
} from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  created_at: string;
  owner: {
    full_name: string | null;
  };
}

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  user_type: string | null;
  created_at: string;
  avatar_url: string | null;
  total_properties: number;
  active_properties: number;
}

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeProperties: 0,
    totalMessages: 0,
    todayVisits: 0,
    weeklyVisits: 0,
    totalUsers: 0,
  });
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPropertiesView, setShowPropertiesView] = useState<'all' | 'available' | 'draft' | 'suspended' | null>(null);
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [weeklyVisitsData, setWeeklyVisitsData] = useState<Array<{ day: string; visits: number }>>([]);

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

  const fetchDashboardData = async () => {
    try {
      // Obtener estadísticas de propiedades
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('status');

      if (propError) throw propError;

      const totalProperties = properties?.length || 0;
      const activeProperties = properties?.filter(p => p.status === 'available').length || 0;

      // Obtener total de mensajes
      const { count: messagesCount, error: msgError } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true });

      if (msgError) throw msgError;

      // Obtener total de usuarios
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Obtener visitas de hoy
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { count: todayVisitsCount, error: todayVisitsError } = await (supabase as any)
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

      if (todayVisitsError) throw todayVisitsError;

      // Obtener visitas de esta semana (últimos 7 días)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: weeklyVisitsCount, error: weeklyVisitsError } = await (supabase as any)
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      if (weeklyVisitsError) throw weeklyVisitsError;

      // Obtener propiedades recientes
      const { data: recentProps, error: recentError } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          city,
          created_at,
          profiles!properties_owner_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      setStats({
        totalProperties,
        activeProperties,
        totalMessages: messagesCount || 0,
        todayVisits: todayVisitsCount || 0,
        weeklyVisits: weeklyVisitsCount || 0,
        totalUsers: usersCount || 0,
      });

      setRecentProperties(recentProps?.map(p => ({
        id: p.id,
        title: p.title,
        city: p.city,
        created_at: p.created_at,
        owner: p.profiles as any
      })) || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, user_type, created_at, avatar_url')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Obtener conteo de propiedades para cada usuario
      const usersWithProperties = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count: totalCount } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', profile.id);

          const { count: activeCount } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', profile.id)
            .eq('status', 'available');

          return {
            ...profile,
            total_properties: totalCount || 0,
            active_properties: activeCount || 0,
          };
        })
      );

      setUsers(usersWithProperties);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Delete user's properties first
      const { error: propsError } = await supabase
        .from('properties')
        .delete()
        .eq('owner_id', userId);

      if (propsError) throw propsError;

      // Delete user's favorites
      const { error: favsError } = await supabase
        .from('property_favorites')
        .delete()
        .eq('user_id', userId);

      if (favsError) throw favsError;

      // Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      toast.success('Usuario eliminado exitosamente');
      fetchUsers();
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar usuario');
    } finally {
      setUserToDelete(null);
    }
  };

  useEffect(() => {
    if (openDialog === 'users') {
      fetchUsers();
    } else if (openDialog === 'weeklyVisits') {
      fetchWeeklyVisitsData();
    }
  }, [openDialog]);

  const fetchWeeklyVisitsData = async () => {
    try {
      const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      const visitsData = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const { count } = await (supabase as any)
          .from('page_views')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString());

        visitsData.push({
          day: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
          visits: count || 0
        });
      }

      setWeeklyVisitsData(visitsData);
    } catch (error) {
      console.error('Error fetching weekly visits data:', error);
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (showPropertiesView) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <PropertiesManagementTable 
            filterStatus={showPropertiesView}
            isAdmin={true}
            onBack={() => setShowPropertiesView(null)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="default"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full w-12 h-12 shadow-xl bg-primary hover:bg-primary/90"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button onClick={() => navigate('/create-property')} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Nueva Propiedad
          </Button>
        </div>
        
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Panel de Administrador</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Panel de control y métricas de la plataforma
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 duration-200" onClick={() => setOpenDialog('totalProperties')}>
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

          <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 duration-200" onClick={() => setOpenDialog('activeProperties')}>
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

          <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 duration-200" onClick={() => setOpenDialog('messages')}>
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

          <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 duration-200" onClick={() => setOpenDialog('todayVisits')}>
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

          <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 duration-200" onClick={() => setOpenDialog('weeklyVisits')}>
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

          <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 duration-200" onClick={() => setOpenDialog('users')}>
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

        {/* Dialogs */}
        <Dialog open={openDialog === 'totalProperties'} onOpenChange={() => setOpenDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Total de Propiedades
              </DialogTitle>
              <DialogDescription>
                Información detallada sobre todas las propiedades en la plataforma
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-muted-foreground mb-1">Activas</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeProperties}</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-muted-foreground mb-1">Totales</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalProperties}</p>
                </div>
              </div>
              <Button onClick={() => setShowPropertiesView('all')} className="w-full">
                Ver todas las propiedades
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={openDialog === 'activeProperties'} onOpenChange={() => setOpenDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Propiedades Activas
              </DialogTitle>
              <DialogDescription>
                Propiedades disponibles y publicadas en el portal
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-muted-foreground mb-1">Total Activas</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.activeProperties}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.totalProperties > 0 ? ((stats.activeProperties / stats.totalProperties) * 100).toFixed(1) : 0}% del total
                </p>
              </div>
              <Button onClick={() => setShowPropertiesView('available')} className="w-full">
                Ver propiedades activas
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={openDialog === 'messages'} onOpenChange={() => setOpenDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Total de Mensajes
              </DialogTitle>
              <DialogDescription>
                Mensajes de contacto recibidos en la plataforma
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-muted-foreground mb-1">Total de Mensajes</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalMessages}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Por Propiedad</p>
                  <p className="text-lg font-semibold">
                    {stats.totalProperties > 0 ? (stats.totalMessages / stats.totalProperties).toFixed(1) : 0}
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Engagement</p>
                  <p className="text-lg font-semibold">
                    {stats.totalProperties > 0 ? ((stats.totalMessages / stats.totalProperties) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={openDialog === 'todayVisits'} onOpenChange={() => setOpenDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Visitas de Hoy
              </DialogTitle>
              <DialogDescription>
                Actividad del portal durante el día de hoy
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-muted-foreground mb-1">Visitas Hoy</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.todayVisits}</p>
                <p className="text-xs text-muted-foreground mt-2">Visitas al portal</p>
              </div>
              <div className="p-3 border rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Promedio diario semanal: {stats.weeklyVisits > 0 ? (stats.weeklyVisits / 7).toFixed(0) : 0} visitas
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={openDialog === 'weeklyVisits'} onOpenChange={() => setOpenDialog(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Visitas Esta Semana
              </DialogTitle>
              <DialogDescription>
                Tendencia de visitas en los últimos 7 días
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-muted-foreground mb-1">Total Semanal</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.weeklyVisits}</p>
                <p className="text-xs text-muted-foreground mt-2">Últimos 7 días</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Visitas por Día</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyVisitsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="day" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar 
                      dataKey="visits" 
                      fill="hsl(var(--orange-600))" 
                      radius={[8, 8, 0, 0]}
                      className="fill-orange-600 dark:fill-orange-400"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Promedio Diario</p>
                  <p className="text-xl font-semibold">{(stats.weeklyVisits / 7).toFixed(0)}</p>
                </div>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Hoy vs Promedio</p>
                  <p className="text-xl font-semibold">
                    {stats.weeklyVisits > 0 ? ((stats.todayVisits / (stats.weeklyVisits / 7)) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={openDialog === 'users'} onOpenChange={() => setOpenDialog(null)}>
          <DialogContent className="max-w-5xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuarios Registrados ({stats.totalUsers})
              </DialogTitle>
              <DialogDescription>
                Gestión completa de usuarios en la plataforma
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <p className="text-xs text-muted-foreground">Total Usuarios</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalUsers}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Propiedades/Usuario</p>
                  <p className="text-2xl font-bold">
                    {stats.totalUsers > 0 ? (stats.totalProperties / stats.totalUsers).toFixed(1) : 0}
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Mensajes/Usuario</p>
                  <p className="text-2xl font-bold">
                    {stats.totalUsers > 0 ? (stats.totalMessages / stats.totalUsers).toFixed(1) : 0}
                  </p>
                </div>
              </div>

              <ScrollArea className="h-[400px] rounded-md border">
                {loadingUsers ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Cargando usuarios...
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No hay usuarios registrados
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead className="text-center">Propiedades Publicadas</TableHead>
                        <TableHead className="text-center">Propiedades Activas</TableHead>
                        <TableHead>Fecha Registro</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {user.avatar_url ? (
                                <img 
                                  src={user.avatar_url} 
                                  alt={user.full_name || 'Usuario'} 
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Users className="h-4 w-4 text-primary" />
                                </div>
                              )}
                              <span>{user.full_name || 'Sin nombre'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              user.user_type === 'owner' 
                                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                                : user.user_type === 'agency'
                                ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                                : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            }`}>
                              {user.user_type === 'tenant' ? 'Arrendatario' : 
                               user.user_type === 'owner' ? 'Propietario' : 
                               user.user_type === 'agency' ? 'Inmobiliaria' : 'No especificado'}
                            </span>
                          </TableCell>
                          <TableCell>{user.phone || 'No proporcionado'}</TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                              {user.total_properties}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                              {user.active_properties}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString('es-CO')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900"
                                onClick={() => {
                                  toast.info('Función de edición en desarrollo');
                                }}
                              >
                                <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-orange-100 dark:hover:bg-orange-900"
                                onClick={() => {
                                  toast.info('Función de suspensión en desarrollo');
                                }}
                              >
                                <Ban className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900"
                                onClick={() => setUserToDelete(user.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el usuario, todas sus propiedades y favoritos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => userToDelete && handleDeleteUser(userToDelete)}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Tabs */}
        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent" className="text-xs sm:text-sm">
              <BarChart3 className="mr-0 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Actividad </span>reciente
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">
              <TrendingUp className="mr-0 sm:mr-2 h-4 w-4" />
              Analíticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Propiedades Recientes</CardTitle>
                <CardDescription>
                  Últimas propiedades publicadas en la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentProperties.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay propiedades recientes
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentProperties.map((property) => (
                      <div
                        key={property.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/property/${property.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{property.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {property.city} • {property.owner?.full_name || 'Sin nombre'}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(property.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
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
                        {stats.totalMessages > 0 && stats.totalProperties > 0
                          ? ((stats.totalMessages / stats.totalProperties) * 100).toFixed(1)
                          : 0}%
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
                        {stats.totalUsers > 0
                          ? (stats.totalProperties / stats.totalUsers).toFixed(1)
                          : 0}
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
    </div>
  );
};

export default AdminDashboard;
