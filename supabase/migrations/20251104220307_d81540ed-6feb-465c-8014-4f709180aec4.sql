-- Fix properties RLS policy to remove NULL owner exposure
-- Drop the existing policy that allows NULL owners
DROP POLICY IF EXISTS "Las propiedades disponibles son visibles públicamente" ON public.properties;

-- Create a new policy that only shows available properties OR properties owned by the current user
-- This prevents NULL-owner properties from being visible when they are in draft/suspended status
CREATE POLICY "Public can view available properties"
ON public.properties
FOR SELECT
USING (
  (status = 'available') 
  OR (auth.uid() = owner_id)
);