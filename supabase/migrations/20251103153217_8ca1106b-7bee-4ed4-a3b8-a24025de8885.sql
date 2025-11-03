-- Crear tabla para favoritos de propiedades
CREATE TABLE IF NOT EXISTS public.property_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Habilitar RLS
ALTER TABLE public.property_favorites ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Los usuarios pueden ver sus propios favoritos"
ON public.property_favorites
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden agregar favoritos"
ON public.property_favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus favoritos"
ON public.property_favorites
FOR DELETE
USING (auth.uid() = user_id);

-- Índice para mejorar rendimiento
CREATE INDEX idx_property_favorites_user_id ON public.property_favorites(user_id);
CREATE INDEX idx_property_favorites_property_id ON public.property_favorites(property_id);