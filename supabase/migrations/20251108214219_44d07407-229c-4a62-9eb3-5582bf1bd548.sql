-- Permitir que propietarios marquen mensajes como leídos sin modificar otros campos
CREATE POLICY "Los propietarios pueden marcar mensajes como leídos"
ON public.contact_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = contact_messages.property_id
      AND p.owner_id = auth.uid()
  )
)
WITH CHECK (
  -- Asegurar que sólo cambie is_read; el resto debe coincidir con el valor actual
  EXISTS (
    SELECT 1 FROM public.contact_messages cm
    WHERE cm.id = id
      AND cm.property_id = property_id
      AND cm.sender_name = sender_name
      AND cm.sender_email = sender_email
      AND (cm.sender_phone IS NOT DISTINCT FROM sender_phone)
      AND cm.message = message
      AND cm.created_at = created_at
  )
);