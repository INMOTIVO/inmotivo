-- Fix the generate_property_code function to avoid escape string errors
CREATE OR REPLACE FUNCTION public.generate_property_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  new_code TEXT;
BEGIN
  -- Get the highest number from existing codes (supporting both INM and INMO formats)
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(property_code FROM '[0-9]+') AS INTEGER
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
$function$;