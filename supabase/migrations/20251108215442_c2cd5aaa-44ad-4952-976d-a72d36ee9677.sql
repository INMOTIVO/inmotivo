-- Add user_id to contact_messages to link messages with authenticated users
ALTER TABLE public.contact_messages
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_contact_messages_user_id ON public.contact_messages(user_id);

-- Update RLS policy to allow users to see their own sent messages
CREATE POLICY "Los usuarios pueden ver sus propios mensajes enviados"
ON public.contact_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert messages with their own user_id
DROP POLICY IF EXISTS "Cualquiera puede enviar mensajes" ON public.contact_messages;

CREATE POLICY "Usuarios autenticados pueden enviar mensajes"
ON public.contact_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create a view for users to see replies to their messages
CREATE OR REPLACE VIEW public.user_message_replies AS
SELECT 
  mr.id,
  mr.contact_message_id,
  mr.reply_text,
  mr.created_at,
  cm.property_id,
  cm.message as original_message,
  cm.sender_name,
  p.title as property_title,
  p.images,
  profiles.full_name as replier_name
FROM public.message_replies mr
JOIN public.contact_messages cm ON mr.contact_message_id = cm.id
JOIN public.properties p ON cm.property_id = p.id
LEFT JOIN public.profiles ON mr.replied_by = profiles.id
WHERE cm.user_id = auth.uid()
ORDER BY mr.created_at DESC;

-- Grant access to the view
GRANT SELECT ON public.user_message_replies TO authenticated;