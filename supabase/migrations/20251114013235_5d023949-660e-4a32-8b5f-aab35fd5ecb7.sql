-- Add property_code column to properties table
ALTER TABLE public.properties
ADD COLUMN property_code TEXT UNIQUE;

-- Create a function to generate the next property code
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
  -- Get the highest number from existing codes
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(property_code FROM 5) AS INTEGER
      )
    ), 0
  ) + 1
  INTO next_number
  FROM public.properties
  WHERE property_code ~ '^INMO[0-9]+$';
  
  -- Generate the new code with leading zeros (e.g., INMO001, INMO002, etc.)
  new_code := 'INMO' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN new_code;
END;
$$;

-- Create a trigger function to auto-assign property code
CREATE OR REPLACE FUNCTION public.assign_property_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only assign code if it's not already set
  IF NEW.property_code IS NULL THEN
    NEW.property_code := generate_property_code();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER set_property_code_on_insert
  BEFORE INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_property_code();

-- Assign codes to existing properties using a CTE
WITH numbered_properties AS (
  SELECT 
    id,
    'INMO' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 3, '0') AS new_code
  FROM public.properties
  WHERE property_code IS NULL
)
UPDATE public.properties
SET property_code = numbered_properties.new_code
FROM numbered_properties
WHERE properties.id = numbered_properties.id;

-- Make property_code NOT NULL after assigning codes
ALTER TABLE public.properties
ALTER COLUMN property_code SET NOT NULL;