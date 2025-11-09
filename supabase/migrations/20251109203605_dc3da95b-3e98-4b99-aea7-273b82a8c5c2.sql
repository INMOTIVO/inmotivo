-- Crear tabla para mensajes del Centro de Ayuda
CREATE TABLE IF NOT EXISTS public.help_center_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'responded')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.help_center_messages ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan crear sus propios mensajes
CREATE POLICY "Los usuarios pueden crear mensajes del centro de ayuda"
ON public.help_center_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Política para que los usuarios puedan ver sus propios mensajes
CREATE POLICY "Los usuarios pueden ver sus propios mensajes del centro"
ON public.help_center_messages
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Política para que los administradores puedan ver todos los mensajes
CREATE POLICY "Los administradores pueden ver todos los mensajes del centro"
ON public.help_center_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política para que los administradores puedan actualizar mensajes
CREATE POLICY "Los administradores pueden actualizar mensajes del centro"
ON public.help_center_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_help_center_messages_updated_at
BEFORE UPDATE ON public.help_center_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();