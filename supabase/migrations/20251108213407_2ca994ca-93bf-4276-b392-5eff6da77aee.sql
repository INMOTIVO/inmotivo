-- Habilitar realtime para contact_messages
ALTER TABLE public.contact_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;

-- Habilitar realtime para message_replies
ALTER TABLE public.message_replies REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_replies;