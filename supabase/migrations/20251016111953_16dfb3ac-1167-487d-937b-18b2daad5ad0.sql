-- Crear buckets de storage para imágenes y videos de propiedades
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('property-images', 'property-images', true),
  ('property-videos', 'property-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para property-images
CREATE POLICY "Cualquiera puede ver imágenes de propiedades"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

CREATE POLICY "Usuarios autenticados pueden subir imágenes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Propietarios pueden actualizar sus imágenes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Propietarios pueden eliminar sus imágenes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images' 
  AND auth.uid() IS NOT NULL
);

-- Políticas para property-videos
CREATE POLICY "Cualquiera puede ver videos de propiedades"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-videos');

CREATE POLICY "Usuarios autenticados pueden subir videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-videos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Propietarios pueden actualizar sus videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-videos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Propietarios pueden eliminar sus videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-videos' 
  AND auth.uid() IS NOT NULL
);