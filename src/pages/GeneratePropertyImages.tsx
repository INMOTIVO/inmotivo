import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Property {
  id: string;
  title: string;
  description: string;
  property_type: string;
  images: any[];
}

const GeneratePropertyImages = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, description, property_type, images')
        .eq('city', 'Caldas')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Error al cargar propiedades');
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async (property: Property) => {
    setGenerating(prev => ({ ...prev, [property.id]: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-property-images', {
        body: {
          propertyId: property.id,
          propertyType: property.property_type,
          description: property.description || property.title
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        // Actualizar la propiedad con la nueva imagen
        const currentImages = property.images || [];
        const { error: updateError } = await supabase
          .from('properties')
          .update({
            images: [...currentImages, data.imageUrl]
          })
          .eq('id', property.id);

        if (updateError) throw updateError;

        setCompleted(prev => ({ ...prev, [property.id]: true }));
        toast.success(`Imagen generada para ${property.title}`);
        
        // Actualizar el estado local
        setProperties(prev => 
          prev.map(p => 
            p.id === property.id 
              ? { ...p, images: [...currentImages, data.imageUrl] }
              : p
          )
        );
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setGenerating(prev => ({ ...prev, [property.id]: false }));
    }
  };

  const generateAllImages = async () => {
    for (const property of properties) {
      if (!completed[property.id] && (property.images?.length || 0) === 0) {
        await generateImage(property);
        // Esperar 2 segundos entre cada generación para evitar rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Generar Imágenes de Propiedades</h1>
        <Button onClick={generateAllImages} disabled={Object.values(generating).some(v => v)}>
          Generar Todas las Imágenes
        </Button>
      </div>

      <div className="grid gap-4">
        {properties.map((property) => (
          <Card key={property.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{property.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {property.description?.substring(0, 100)}...
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Imágenes actuales: {property.images?.length || 0}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {completed[property.id] && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                
                {(property.images?.length || 0) === 0 && (
                  <Button
                    onClick={() => generateImage(property)}
                    disabled={generating[property.id]}
                    size="sm"
                  >
                    {generating[property.id] ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      'Generar Imagen'
                    )}
                  </Button>
                )}
                
                {(property.images?.length || 0) > 0 && !completed[property.id] && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Completado
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GeneratePropertyImages;
