-- Hacer owner_id nullable temporalmente para propiedades de demo
ALTER TABLE public.properties ALTER COLUMN owner_id DROP NOT NULL;

-- Actualizar política de selección para incluir propiedades demo sin owner
DROP POLICY IF EXISTS "Las propiedades disponibles son visibles públicamente" ON public.properties;

CREATE POLICY "Las propiedades disponibles son visibles públicamente"
  ON public.properties FOR SELECT
  USING (status = 'available' OR owner_id IS NULL OR auth.uid() = owner_id);