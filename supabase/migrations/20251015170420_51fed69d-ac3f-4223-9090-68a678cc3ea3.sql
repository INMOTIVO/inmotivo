-- Drop the security definer view that's causing the linter warning
DROP VIEW IF EXISTS public.profiles_public;

-- Drop the unused function
DROP FUNCTION IF EXISTS public.can_view_profile_phone(uuid);

-- The proper solution is to handle phone number visibility in the application layer
-- RLS policies work at row level, not column level
-- Application code should only query phone when auth.uid() = profile.id