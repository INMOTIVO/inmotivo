-- Crear tabla para respuestas de proveedores a mensajes
CREATE TABLE IF NOT EXISTS public.message_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_message_id UUID NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  replied_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.message_replies ENABLE ROW LEVEL SECURITY;

-- Los propietarios pueden ver respuestas de mensajes de sus propiedades
CREATE POLICY "Los propietarios pueden ver respuestas de sus mensajes"
ON public.message_replies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM contact_messages cm
    JOIN properties p ON cm.property_id = p.id
    WHERE cm.id = message_replies.contact_message_id
    AND p.owner_id = auth.uid()
  )
);

-- Los propietarios pueden crear respuestas a mensajes de sus propiedades
CREATE POLICY "Los propietarios pueden responder a mensajes de sus propiedades"
ON public.message_replies
FOR INSERT
WITH CHECK (
  auth.uid() = replied_by AND
  EXISTS (
    SELECT 1 FROM contact_messages cm
    JOIN properties p ON cm.property_id = p.id
    WHERE cm.id = message_replies.contact_message_id
    AND p.owner_id = auth.uid()
  )
);

-- Agregar columna para marcar mensajes como leídos
ALTER TABLE public.contact_messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_message_replies_contact_message 
ON public.message_replies(contact_message_id);

CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read 
ON public.contact_messages(is_read);