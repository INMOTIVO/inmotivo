-- Crear tabla para trackear visitas a páginas
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON public.page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON public.page_views(user_id);

-- Habilitar RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserciones a cualquiera
CREATE POLICY "Cualquiera puede registrar visitas"
ON public.page_views
FOR INSERT
TO public
WITH CHECK (true);

-- Política para que solo admins puedan ver las visitas
CREATE POLICY "Solo admins pueden ver visitas"
ON public.page_views
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));