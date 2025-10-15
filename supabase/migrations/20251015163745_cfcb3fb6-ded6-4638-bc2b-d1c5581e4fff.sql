-- Hacer owner_id nullable temporalmente para datos de demostración
ALTER TABLE public.properties ALTER COLUMN owner_id DROP NOT NULL;

-- Actualizar política de SELECT para mostrar propiedades sin dueño (demos)
DROP POLICY IF EXISTS "Las propiedades disponibles son visibles públicamente" ON public.properties;

CREATE POLICY "Las propiedades disponibles son visibles públicamente"
  ON public.properties FOR SELECT
  USING (status = 'available' OR auth.uid() = owner_id OR owner_id IS NULL);