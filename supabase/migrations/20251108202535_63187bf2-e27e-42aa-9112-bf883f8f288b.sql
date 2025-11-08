-- Crear tabla de departamentos
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text,
  created_at timestamp with time zone DEFAULT now()
);

-- Crear tabla de municipios
CREATE TABLE IF NOT EXISTS public.municipalities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  code text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(name, department_id)
);

-- Crear tabla de barrios
CREATE TABLE IF NOT EXISTS public.neighborhoods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  municipality_id uuid REFERENCES public.municipalities(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(name, municipality_id)
);

-- Habilitar RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública (cualquiera puede leer las ubicaciones)
CREATE POLICY "Cualquiera puede ver departamentos"
  ON public.departments FOR SELECT
  USING (true);

CREATE POLICY "Cualquiera puede ver municipios"
  ON public.municipalities FOR SELECT
  USING (true);

CREATE POLICY "Cualquiera puede ver barrios"
  ON public.neighborhoods FOR SELECT
  USING (true);

-- Políticas de escritura solo para admins
CREATE POLICY "Solo admins pueden gestionar departamentos"
  ON public.departments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Solo admins pueden gestionar municipios"
  ON public.municipalities FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Solo admins pueden gestionar barrios"
  ON public.neighborhoods FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_municipalities_department ON public.municipalities(department_id);
CREATE INDEX idx_neighborhoods_municipality ON public.neighborhoods(municipality_id);
CREATE INDEX idx_departments_name ON public.departments(name);
CREATE INDEX idx_municipalities_name ON public.municipalities(name);
CREATE INDEX idx_neighborhoods_name ON public.neighborhoods(name);