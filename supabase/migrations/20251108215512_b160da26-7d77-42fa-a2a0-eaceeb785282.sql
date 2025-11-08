-- Fix security definer view by dropping it and using direct queries with RLS instead
DROP VIEW IF EXISTS public.user_message_replies;

-- Grant necessary permissions for authenticated users to query message_replies
-- The RLS policies will handle the actual access control
GRANT SELECT ON public.message_replies TO authenticated;
GRANT SELECT ON public.contact_messages TO authenticated;
GRANT SELECT ON public.properties TO authenticated;