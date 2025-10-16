-- Tabla para almacenar los mensajes de contacto de los interesados
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_phone TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Los propietarios pueden ver los mensajes de sus propiedades
CREATE POLICY "Los propietarios pueden ver mensajes de sus propiedades"
ON public.contact_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = contact_messages.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- Cualquiera puede enviar mensajes de contacto
CREATE POLICY "Cualquiera puede enviar mensajes"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

-- Índice para mejorar rendimiento
CREATE INDEX idx_contact_messages_property_id ON public.contact_messages(property_id);
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at DESC);