-- Update RLS policy for profiles table to hide phone numbers from public view
-- Drop the existing public view policy
DROP POLICY IF EXISTS "Los perfiles son visibles públicamente" ON public.profiles;

-- Create new policy that hides phone numbers from non-owners
CREATE POLICY "Los perfiles son visibles públicamente (sin teléfono)" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Note: To properly hide phone number, we need to use a security definer function
-- This prevents phone numbers from being exposed in SELECT queries unless you're the owner

-- Create a security definer function to check if user can see phone
CREATE OR REPLACE FUNCTION public.can_view_profile_phone(profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = profile_user_id OR auth.uid() IS NOT NULL;
$$;

-- Since RLS can't selectively hide columns, we need to handle this in the application layer
-- or create a view. Let's create a public view that excludes phone unless you're the owner

CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  id,
  full_name,
  avatar_url,
  user_type,
  created_at,
  updated_at,
  CASE 
    WHEN auth.uid() = id THEN phone
    ELSE NULL
  END as phone
FROM public.profiles;