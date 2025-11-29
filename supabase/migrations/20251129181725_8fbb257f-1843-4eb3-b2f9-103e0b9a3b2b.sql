-- Create enum for profile types (business roles)
CREATE TYPE public.profile_type AS ENUM ('owner', 'tenant', 'buyer');

-- Create profile_types table for multi-role support
CREATE TABLE public.profile_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type profile_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, type)
);

-- Create index for fast lookups
CREATE INDEX idx_profile_types_user_id ON public.profile_types(user_id);

-- Enable Row Level Security
ALTER TABLE public.profile_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile types"
  ON public.profile_types FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add profile types to themselves"
  ON public.profile_types FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profile types"
  ON public.profile_types FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create helper function to check profile type
CREATE OR REPLACE FUNCTION public.has_profile_type(_user_id uuid, _type profile_type)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_types
    WHERE user_id = _user_id
      AND type = _type
  )
$$;

-- Modify handle_new_user trigger to insert into profile_types
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  user_type_value text;
BEGIN
  -- Get user_type from metadata, default to 'tenant'
  user_type_value := COALESCE(NEW.raw_user_meta_data->>'user_type', 'tenant');
  
  -- Create profile (keeping user_type for backward compatibility temporarily)
  INSERT INTO public.profiles (id, full_name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_type_value
  );
  
  -- Add the profile type to the new table
  INSERT INTO public.profile_types (user_id, type)
  VALUES (
    NEW.id,
    user_type_value::profile_type
  );
  
  RETURN NEW;
END;
$$;

-- Migrate existing data from profiles.user_type to profile_types
INSERT INTO public.profile_types (user_id, type)
SELECT id, user_type::profile_type
FROM public.profiles
WHERE user_type IS NOT NULL
  AND user_type IN ('owner', 'tenant', 'buyer')
ON CONFLICT (user_id, type) DO NOTHING;