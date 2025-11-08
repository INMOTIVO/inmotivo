import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Phone, Mail, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContactMessage {
  id: string;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  message: string;
  created_at: string;
  property_id: string;
  is_read: boolean;
  properties: {
    title: string;
  };
}

interface MessageReply {
  id: string;
  reply_text: string;
  created_at: string;
}

interface MessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ContactMessage[];
  userId: string;
  onMessagesUpdate: () => void;
}

export const MessagesDialog = ({ 
  open, 
  onOpenChange, 
  messages,
  userId,
  onMessagesUpdate
}: MessagesDialogProps) => {
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replies, setReplies] = useState<Record<string, MessageReply[]>>({});

  const handleSelectMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    
    // Marcar como leído
    if (!message.is_read) {
      await supabase
        .from('contact_messages')
        .update({ is_read: true })
        .eq('id', message.id);
      onMessagesUpdate();
    }

    // Cargar respuestas previas
    const { data } = await supabase
      .from('message_replies')
      .select('*')
      .eq('contact_message_id', message.id)
      .order('created_at', { ascending: true });

    if (data) {
      setReplies(prev => ({ ...prev, [message.id]: data }));
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('message_replies')
        .insert({
          contact_message_id: selectedMessage.id,
          reply_text: replyText.trim(),
          replied_by: userId,
        });

      if (error) throw error;

      toast.success('Respuesta guardada');
      setReplyText('');
      
      // Recargar respuestas
      const { data } = await supabase
        .from('message_replies')
        .select('*')
        .eq('contact_message_id', selectedMessage.id)
        .order('created_at', { ascending: true });

      if (data) {
        setReplies(prev => ({ ...prev, [selectedMessage.id]: data }));
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Error al enviar respuesta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    if (!selectedMessage?.sender_phone) return;
    
    const phone = selectedMessage.sender_phone.replace(/\D/g, '');
    const message = `Hola ${selectedMessage.sender_name}, gracias por tu interés en: ${selectedMessage.properties.title}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleEmail = () => {
    if (!selectedMessage) return;
    
    const subject = `Re: ${selectedMessage.properties.title}`;
    const body = `Hola ${selectedMessage.sender_name},\n\nGracias por tu mensaje:\n"${selectedMessage.message}"\n\n`;
    window.open(`mailto:${selectedMessage.sender_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Mensajes Recibidos
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} nuevos</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid md:grid-cols-2 gap-4 overflow-hidden">
          {/* Lista de mensajes */}
          <div className="space-y-2 overflow-y-auto pr-2">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay mensajes aún
              </p>
            ) : (
              messages.map((message) => (
                <Card
                  key={message.id}
                  className={`cursor-pointer transition-all ${
                    selectedMessage?.id === message.id
                      ? 'border-primary shadow-md'
                      : 'hover:shadow-sm'
                  } ${!message.is_read ? 'bg-accent/50' : ''}`}
                  onClick={() => handleSelectMessage(message)}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold text-sm">{message.sender_name}</h3>
                      {!message.is_read && (
                        <Badge variant="destructive" className="text-xs">Nuevo</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {message.properties.title}
                    </p>
                    <p className="text-sm line-clamp-2">{message.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Detalle del mensaje */}
          <div className="border-l pl-4 overflow-y-auto flex flex-col">
            {selectedMessage ? (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedMessage.sender_name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Mail className="h-3 w-3" />
                      {selectedMessage.sender_email}
                    </p>
                    {selectedMessage.sender_phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Phone className="h-3 w-3" />
                        {selectedMessage.sender_phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Propiedad interesada:
                    </p>
                    <p className="font-medium text-sm">{selectedMessage.properties.title}</p>
                  </div>

                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Mensaje original:</p>
                    <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>

                  {/* Respuestas previas */}
                  {replies[selectedMessage.id]?.map((reply) => (
                    <div key={reply.id} className="bg-primary/10 p-3 rounded-lg border-l-4 border-primary">
                      <p className="text-xs text-muted-foreground mb-1">
                        Tu respuesta - {new Date(reply.created_at).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{reply.reply_text}</p>
                    </div>
                  ))}
                </div>

                {/* Formulario de respuesta */}
                <div className="space-y-2 pt-4 border-t">
                  <label className="text-sm font-medium">Escribir respuesta:</label>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escribe tu respuesta aquí..."
                    className="min-h-[100px] resize-none"
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || submitting}
                    className="w-full"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submitting ? 'Enviando...' : 'Enviar Respuesta'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Tu respuesta se guardará y podrás ver el historial de conversación con este cliente.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-center">
                  Selecciona un mensaje<br />para ver detalles
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
