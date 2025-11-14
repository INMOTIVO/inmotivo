-- Update the generate_property_code function to use INM prefix instead of INMO
CREATE OR REPLACE FUNCTION public.generate_property_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  new_code TEXT;
BEGIN
  -- Get the highest number from existing codes (supporting both INM and INMO formats)
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(property_code FROM '(INM|INMO)([0-9]+)' FOR '#,#') AS INTEGER
      )
    ), 0
  ) + 1
  INTO next_number
  FROM public.properties
  WHERE property_code ~ '^(INM|INMO)[0-9]+$';
  
  -- Generate the new code with INM prefix and leading zeros
  new_code := 'INM' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN new_code;
END;
$$;

-- Update existing property codes from INMO to INM
UPDATE public.properties
SET property_code = REPLACE(property_code, 'INMO', 'INM')
WHERE property_code LIKE 'INMO%';