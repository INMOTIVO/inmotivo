-- Agregar política para que los administradores puedan ver todos los mensajes
CREATE POLICY "Los administradores pueden ver todos los mensajes"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);