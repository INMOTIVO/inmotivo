import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Trash2, Eye, Power, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Property {
  id: string;
  title: string;
  property_code?: string;
  price: number;
  currency: string;
  status: string;
  property_type: string;
  city: string;
  neighborhood: string;
  owner_id: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
}

interface PropertiesManagementTableProps {
  filterStatus?: 'all' | 'available' | 'draft' | 'suspended';
  userId?: string;
  isAdmin?: boolean;
  onBack?: () => void;
}

const PropertiesManagementTable = ({ 
  filterStatus = 'all', 
  userId,
  isAdmin = false,
  onBack
}: PropertiesManagementTableProps) => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(filterStatus);

  useEffect(() => {
    fetchProperties();
  }, [userId, isAdmin, statusFilter]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      let query = supabase.from('properties').select(`
        *,
        profiles!properties_owner_id_fkey(full_name)
      `);

      if (!isAdmin && userId) {
        query = query.eq('owner_id', userId);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Error al cargar propiedades');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (property: Property) => {
    const newStatus = property.status === 'available' ? 'suspended' : 'available';
    
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', property.id);

      if (error) throw error;
      
      toast.success(
        newStatus === 'available' 
          ? 'Propiedad activada' 
          : 'Propiedad suspendida'
      );
      fetchProperties();
    } catch (error) {
      console.error('Error updating property status:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (id: string) => {
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

  const propertyTypeLabels: Record<string, string> = {
    apartment: 'Apartamento',
    house: 'Casa',
    studio: 'Apartaestudio',
    commercial: 'Local Comercial',
    warehouse: 'Bodega',
  };

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    available: { label: 'Activa', variant: 'default' },
    draft: { label: 'Borrador', variant: 'secondary' },
    suspended: { label: 'Suspendida', variant: 'destructive' },
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p>Cargando propiedades...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <CardTitle>Gestión de Propiedades</CardTitle>
              <CardDescription>
                Administra, edita o elimina propiedades
              </CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="available">Activas</SelectItem>
                  <SelectItem value="draft">Borradores</SelectItem>
                  <SelectItem value="suspended">Suspendidas</SelectItem>
                </SelectContent>
              </Select>
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay propiedades para mostrar
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                {isAdmin && <TableHead>Propietario</TableHead>}
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
                <TableBody>
                  {properties.map((property) => {
                    const priceFormatted = new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: property.currency,
                      minimumFractionDigits: 0,
                    }).format(property.price);

                    return (
                      <TableRow key={property.id}>
                        <TableCell className="font-mono text-sm">
                          {property.property_code}
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {property.title}
                        </TableCell>
                        <TableCell>
                          {propertyTypeLabels[property.property_type] || property.property_type}
                        </TableCell>
                        <TableCell>
                          {property.neighborhood}, {property.city}
                        </TableCell>
                        <TableCell>{priceFormatted}</TableCell>
                        <TableCell>
                          <Badge variant={statusLabels[property.status]?.variant || 'secondary'}>
                            {statusLabels[property.status]?.label || property.status}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            {property.profiles?.full_name || 'Sin nombre'}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/property/${property.id}`)}
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/edit-property/${property.id}`)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleStatus(property)}
                              title={property.status === 'available' ? 'Suspender' : 'Activar'}
                            >
                              <Power className={`h-4 w-4 ${
                                property.status === 'available' 
                                  ? 'text-green-600' 
                                  : 'text-muted-foreground'
                              }`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(property.id)}
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertiesManagementTable;
