import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, Mail, Building2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: {
    id: string;
    title: string;
    agency?: {
      name: string;
      phone?: string;
      email?: string;
    } | null;
    owner?: {
      full_name?: string;
      phone?: string;
    } | null;
  };
}

const contactSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  email: z.string().trim().email('Email inválido').max(255, 'Máximo 255 caracteres'),
  phone: z.string().trim().max(20, 'Máximo 20 caracteres').optional(),
  message: z.string().trim().min(1, 'El mensaje es requerido').max(1000, 'Máximo 1000 caracteres'),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactDialog = ({ open, onOpenChange, property }: ContactDialogProps) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAgency = !!property.agency;
  const contactName = isAgency ? property.agency?.name : property.owner?.full_name || 'Propietario';
  const contactPhone = isAgency ? property.agency?.phone : property.owner?.phone;
  const contactEmail = property.agency?.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validar datos
    const validation = contactSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      validation.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof ContactFormData] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('contact_messages').insert({
        property_id: property.id,
        sender_name: validation.data.name,
        sender_email: validation.data.email,
        sender_phone: validation.data.phone || null,
        message: validation.data.message,
      });

      if (error) throw error;

      toast.success('Mensaje enviado correctamente');
      setFormData({ name: '', email: '', phone: '', message: '' });
      onOpenChange(false);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast.error('Error al enviar el mensaje. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    if (!contactPhone) return;
    const message = encodeURIComponent(
      `Hola, estoy interesado en la propiedad: ${property.title}`
    );
    window.open(`https://wa.me/${contactPhone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contactar</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del publicador */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              {isAgency ? (
                <>
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>Este inmueble fue publicado por una inmobiliaria</span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4 text-primary" />
                  <span>Este inmueble fue publicado por un propietario directo</span>
                </>
              )}
            </div>

            <div className="space-y-2">
              <p className="font-semibold">{contactName}</p>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{contactPhone || '+57 300 123 4567'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{contactEmail || 'contacto@ejemplo.com'}</span>
              </div>
            </div>

            {contactPhone && (
              <Button
                onClick={handleWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#20BA5A]"
                size="sm"
              >
                <Phone className="mr-2 h-4 w-4" />
                Contactar por WhatsApp
              </Button>
            )}
          </div>

          {/* Separador con texto */}
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Puedes contactarlo por la app
            </p>
          </div>

          {/* Formulario de mensaje */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tu nombre"
                maxLength={100}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tu@email.com"
                maxLength={255}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Tu teléfono"
                maxLength={20}
              />
            </div>

            <div>
              <Label htmlFor="message">Mensaje *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Escribe tu mensaje aquí..."
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.message.length}/1000 caracteres
              </p>
              {errors.message && (
                <p className="text-sm text-destructive mt-1">{errors.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDialog;
