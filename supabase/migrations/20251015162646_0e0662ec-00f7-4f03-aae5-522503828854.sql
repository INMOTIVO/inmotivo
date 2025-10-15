-- Crear tabla de perfiles de usuarios
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('tenant', 'owner', 'agency')) DEFAULT 'tenant',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Los perfiles son visibles públicamente"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden insertar su propio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Crear tabla de inmobiliarias
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  website TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en agencies
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Políticas para agencies
CREATE POLICY "Las inmobiliarias son visibles públicamente"
  ON public.agencies FOR SELECT
  USING (true);

CREATE POLICY "Los dueños pueden gestionar sus inmobiliarias"
  ON public.agencies FOR ALL
  USING (auth.uid() = user_id);

-- Crear tabla de propiedades
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT CHECK (property_type IN ('apartment', 'house', 'commercial', 'warehouse', 'studio')) NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'COP',
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  area_m2 DECIMAL(10, 2),
  floor INTEGER,
  parking_spaces INTEGER DEFAULT 0,
  furnished BOOLEAN DEFAULT false,
  pets_allowed BOOLEAN DEFAULT false,
  images JSONB DEFAULT '[]'::jsonb,
  amenities JSONB DEFAULT '[]'::jsonb,
  status TEXT CHECK (status IN ('available', 'rented', 'maintenance', 'draft')) DEFAULT 'draft',
  verified BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Políticas para properties
CREATE POLICY "Las propiedades disponibles son visibles públicamente"
  ON public.properties FOR SELECT
  USING (status = 'available' OR auth.uid() = owner_id);

CREATE POLICY "Los dueños pueden crear propiedades"
  ON public.properties FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Los dueños pueden actualizar sus propiedades"
  ON public.properties FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Los dueños pueden eliminar sus propiedades"
  ON public.properties FOR DELETE
  USING (auth.uid() = owner_id);

-- Crear tabla de búsquedas (para historial y aprendizaje de IA)
CREATE TABLE public.searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  filters JSONB DEFAULT '{}'::jsonb,
  results_count INTEGER DEFAULT 0,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en searches
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;

-- Políticas para searches
CREATE POLICY "Los usuarios pueden ver sus propias búsquedas"
  ON public.searches FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Cualquiera puede crear búsquedas"
  ON public.searches FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para crear perfil automáticamente cuando un usuario se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Índices para mejorar el rendimiento
CREATE INDEX idx_properties_city ON public.properties(city);
CREATE INDEX idx_properties_neighborhood ON public.properties(neighborhood);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_price ON public.properties(price);
CREATE INDEX idx_properties_location ON public.properties(latitude, longitude);
CREATE INDEX idx_searches_user_id ON public.searches(user_id);
CREATE INDEX idx_agencies_user_id ON public.agencies(user_id);