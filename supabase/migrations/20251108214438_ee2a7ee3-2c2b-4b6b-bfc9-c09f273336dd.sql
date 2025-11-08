-- Fix RLS recursion and allow owners to mark messages as read safely

-- 1) Remove previous problematic policy to avoid recursion
DROP POLICY IF EXISTS "Los propietarios pueden marcar mensajes como leídos" ON public.contact_messages;

-- 2) Create a clean UPDATE policy without self-referencing contact_messages
CREATE POLICY "Los propietarios pueden actualizar mensajes (is_read)"
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
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = contact_messages.property_id
      AND p.owner_id = auth.uid()
  )
);

-- 3) Add a trigger to ensure only is_read can be updated (defense in depth)
CREATE OR REPLACE FUNCTION public.ensure_only_is_read_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow changing the is_read field
  IF (NEW.id, NEW.property_id, NEW.sender_name, NEW.sender_email, NEW.sender_phone, NEW.message, NEW.created_at)
     IS DISTINCT FROM
     (OLD.id, OLD.property_id, OLD.sender_name, OLD.sender_email, OLD.sender_phone, OLD.message, OLD.created_at) THEN
    RAISE EXCEPTION 'Only is_read can be updated';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contact_messages_only_is_read ON public.contact_messages;
CREATE TRIGGER contact_messages_only_is_read
BEFORE UPDATE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.ensure_only_is_read_updated();