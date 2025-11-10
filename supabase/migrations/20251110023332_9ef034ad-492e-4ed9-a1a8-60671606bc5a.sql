-- Add listing_type column to properties table
ALTER TABLE public.properties 
ADD COLUMN listing_type text DEFAULT 'rent' CHECK (listing_type IN ('rent', 'sale'));

-- Add index for better performance on filtering
CREATE INDEX idx_properties_listing_type ON public.properties(listing_type);

-- Add comment for documentation
COMMENT ON COLUMN public.properties.listing_type IS 'Type of listing: rent (arriendo) or sale (venta)';
