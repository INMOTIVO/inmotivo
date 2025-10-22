-- Crear el enum de roles
CREATE TYPE public.app_role AS ENUM ('admin', 'provider', 'user');

-- Crear la tabla de roles de usuario
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Crear función segura para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Políticas RLS para user_roles
CREATE POLICY "Los usuarios pueden ver sus propios roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Solo los admins pueden gestionar roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Crear tabla de métricas del sistema
CREATE TABLE public.system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_visits INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_properties INTEGER DEFAULT 0,
  active_properties INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (date)
);

ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver métricas
CREATE POLICY "Solo admins pueden ver métricas"
ON public.system_metrics
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Solo admins pueden actualizar métricas
CREATE POLICY "Solo admins pueden actualizar métricas"
ON public.system_metrics
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));