import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Navbar from '@/components/Navbar';
import { Upload, X, Loader2, MapPin, ArrowLeft, Star } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useGoogleMapsPlaces } from '@/hooks/useGoogleMapsPlaces';
import { useGoogleMapsLoader } from '@/hooks/useGoogleMapsLoader';

const propertySchema = z.object({
  title: z.string().min(5, 'Mínimo 5 caracteres').max(100, 'Máximo 100 caracteres'),
  description: z.string().min(20, 'Mínimo 20 caracteres').max(1000, 'Máximo 1000 caracteres'),
  property_type: z.string().min(1, 'Selecciona un tipo'),
  price: z.number().min(1, 'El precio debe ser mayor a 0'),
  address: z.string().min(5, 'Dirección requerida'),
  city: z.string().min(2, 'Ciudad requerida'),
  neighborhood: z.string().min(2, 'Barrio requerido'),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  area_m2: z.number().min(1, 'Área requerida'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

type PropertyFormData = z.infer<typeof propertySchema>;

const CreateProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [loadingCoordinates, setLoadingCoordinates] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof PropertyFormData, string>>>({});
  const addressInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    property_type: '',
    price: 0,
    address: '',
    city: 'Medellín',
    neighborhood: '',
    bedrooms: 0,
    bathrooms: 0,
    area_m2: 0,
    latitude: 6.2442,
    longitude: -75.5812,
  });

  const [listingType, setListingType] = useState<'rent' | 'sale'>('rent');

  const [amenities, setAmenities] = useState<string[]>([]);
  const [furnished, setFurnished] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);

  const { isLoaded } = useGoogleMapsLoader();

  const handlePlaceSelected = useCallback((place: google.maps.places.PlaceResult) => {
    if (!place.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    let city = '';
    let neighborhood = '';
    let address = '';

    // Extraer componentes de la dirección
    place.address_components?.forEach((component) => {
      const types = component.types;
      
      if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_2') && !city) {
        city = component.long_name;
      }
      
      if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
        neighborhood = component.long_name;
      } else if (types.includes('neighborhood') && !neighborhood) {
        neighborhood = component.long_name;
      }
      
      if (types.includes('route')) {
        address = component.long_name;
      } else if (types.includes('street_address') && !address) {
        address = component.long_name;
      }
    });

    // Si no encontramos dirección específica, usar la dirección formateada
    if (!address && place.formatted_address) {
      address = place.formatted_address.split(',')[0];
    }

    // Actualizar todos los campos usando functional update para evitar dependencia
    setFormData(prev => ({
      ...prev,
      address: address || prev.address,
      city: city || prev.city,
      neighborhood: neighborhood || prev.neighborhood,
      latitude: lat,
      longitude: lng,
    }));

    toast.success('Dirección autocompletada correctamente');
  }, []);

  useGoogleMapsPlaces({
    inputRef: addressInputRef,
    onPlaceSelected: handlePlaceSelected,
    options: {
      componentRestrictions: { country: 'co' },
      fields: ['address_components', 'geometry', 'formatted_address'],
    },
  });


  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) {
      loadProperty();
    }
  }, [id, user]);

  const loadProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('owner_id', user?.id)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title,
        description: data.description || '',
        property_type: data.property_type,
        price: data.price,
        address: data.address,
        city: data.city,
        neighborhood: data.neighborhood || '',
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
        area_m2: data.area_m2 || 0,
        latitude: data.latitude || 6.2442,
        longitude: data.longitude || -75.5812,
      });

      setListingType((data.listing_type as 'rent' | 'sale') || 'rent');
      setImages((data.images as string[]) || []);
      setAmenities((data.amenities as string[]) || []);
      setFurnished(data.furnished || false);
      setPetsAllowed(data.pets_allowed || false);
    } catch (error) {
      console.error('Error loading property:', error);
      toast.error('Error al cargar la propiedad');
      navigate('/dashboard');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 10) {
      toast.error('Máximo 10 imágenes permitidas');
      return;
    }

    setUploadingImages(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} es muy grande (máx 5MB)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Math.random()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
      }

      setImages([...images, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} imágenes subidas`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Error al subir imágenes');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    
    // Ajustar el índice de la portada si es necesario
    if (index === coverImageIndex) {
      setCoverImageIndex(0);
    } else if (index < coverImageIndex) {
      setCoverImageIndex(coverImageIndex - 1);
    }
  };

  const setCoverImage = (index: number) => {
    setCoverImageIndex(index);
    toast.success('Foto de portada actualizada');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validar
    const validation = propertySchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof PropertyFormData, string>> = {};
      validation.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof PropertyFormData] = error.message;
        }
      });
      setErrors(fieldErrors);
      toast.error('Por favor corrige los errores del formulario');
      return;
    }

    if (images.length === 0) {
      toast.error('Debes subir al menos 1 imagen');
      return;
    }

    setLoading(true);

    try {
      // Reordenar imágenes para que la portada esté primero
      const orderedImages = [...images];
      if (coverImageIndex > 0) {
        const coverImage = orderedImages.splice(coverImageIndex, 1)[0];
        orderedImages.unshift(coverImage);
      }

      const propertyData = {
        title: validation.data.title,
        description: validation.data.description,
        property_type: validation.data.property_type,
        listing_type: listingType,
        price: validation.data.price,
        address: validation.data.address,
        city: validation.data.city,
        neighborhood: validation.data.neighborhood,
        bedrooms: validation.data.bedrooms,
        bathrooms: validation.data.bathrooms,
        area_m2: validation.data.area_m2,
        latitude: validation.data.latitude,
        longitude: validation.data.longitude,
        owner_id: user?.id,
        images: orderedImages,
        amenities: amenities,
        furnished,
        pets_allowed: petsAllowed,
        currency: 'COP',
        status: 'available',
      };

      if (id) {
        // Actualizar
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', id)
          .eq('owner_id', user?.id);

        if (error) throw error;
        toast.success('Propiedad actualizada');
      } else {
        // Crear
        const { error } = await supabase
          .from('properties')
          .insert([propertyData]);

        if (error) throw error;
        toast.success('Propiedad publicada exitosamente');
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error('Error al guardar la propiedad');
    } finally {
      setLoading(false);
    }
  };

  const getCoordinatesFromAddress = async () => {
    // Validar que los campos necesarios estén completos
    if (!formData.address || !formData.city) {
      toast.error('Por favor completa la dirección y ciudad primero');
      return;
    }

    if (!window.google?.maps?.Geocoder) {
      toast.error('Cargando servicios de Google Maps...');
      return;
    }

    setLoadingCoordinates(true);
    
    // Construir dirección completa
    const addressParts = [
      formData.address,
      formData.neighborhood,
      formData.city,
      'Colombia'
    ].filter(Boolean);
    
    const fullAddress = addressParts.join(', ');
    
    try {
      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode(
        {
          address: fullAddress,
          componentRestrictions: {
            country: 'CO',
          },
        },
        (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            const lat = location.lat();
            const lng = location.lng();
            
            // Actualizar coordenadas
            setFormData(prev => ({
              ...prev,
              latitude: lat,
              longitude: lng,
            }));
            
            toast.success(`Coordenadas obtenidas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          } else {
            console.error('Geocoding error:', status);
            toast.error('No se encontraron coordenadas para esta dirección. Verifica que sea correcta.');
          }
          setLoadingCoordinates(false);
        }
      );
    } catch (error) {
      console.error('Error getting coordinates:', error);
      toast.error('Error al obtener coordenadas. Intenta nuevamente.');
      setLoadingCoordinates(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  const commonAmenities = [
    'Piscina',
    'Gimnasio',
    'Parqueadero',
    'Portería 24h',
    'Zona BBQ',
    'Salón Social',
    'Ascensor',
    'Balcón',
    'Terraza',
    'Zona de lavandería',
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <Button
          variant="default"
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="mb-4 rounded-full w-12 h-12 shadow-xl bg-primary hover:bg-primary/90"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            {id ? 'Editar Propiedad' : 'Publicar Nueva Propiedad'}
          </h1>
          <p className="text-muted-foreground mt-2">
            Completa la información de tu propiedad
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo de transacción *</Label>
                <RadioGroup
                  value={listingType}
                  onValueChange={(value: 'rent' | 'sale') => setListingType(value)}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rent" id="rent" />
                    <Label htmlFor="rent" className="font-normal cursor-pointer">
                      Arrendar
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sale" id="sale" />
                    <Label htmlFor="sale" className="font-normal cursor-pointer">
                      Vender
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="title">Título de la propiedad *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ej: Apartamento moderno en El Poblado"
                  maxLength={100}
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe tu propiedad en detalle..."
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.description.length}/1000 caracteres
                </p>
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="property_type">Tipo de propiedad *</Label>
                  <Select
                    value={formData.property_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, property_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartamento</SelectItem>
                      <SelectItem value="house">Casa</SelectItem>
                      <SelectItem value="studio">Apartaestudio</SelectItem>
                      <SelectItem value="commercial">Local Comercial</SelectItem>
                      <SelectItem value="warehouse">Bodega</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.property_type && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.property_type}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="price">Precio mensual *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      $
                    </span>
                    <Input
                      id="price"
                      type="text"
                      value={formData.price ? formData.price.toLocaleString('es-CO') : ''}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/\D/g, '');
                        setFormData({
                          ...formData,
                          price: parseInt(numericValue) || 0,
                        });
                      }}
                      placeholder=""
                      className="pl-7"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      COP
                    </span>
                  </div>
                  {errors.price && (
                    <p className="text-sm text-destructive mt-1">{errors.price}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle>Ubicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Dirección completa *</Label>
                <Input
                  ref={addressInputRef}
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Empieza a escribir la dirección..."
                  disabled={!isLoaded}
                />
                {!isLoaded && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Cargando autocompletado...
                  </p>
                )}
                {isLoaded && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Escribe para buscar direcciones exactas con Google Maps
                  </p>
                )}
                {errors.address && (
                  <p className="text-sm text-destructive mt-1">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Ciudad *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="neighborhood">Barrio *</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) =>
                      setFormData({ ...formData, neighborhood: e.target.value })
                    }
                    placeholder=""
                  />
                  {errors.neighborhood && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.neighborhood}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Latitud</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        latitude: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Longitud</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        longitude: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={getCoordinatesFromAddress}
                className="w-full"
                disabled={loadingCoordinates || !formData.address || !formData.city || !isLoaded}
              >
                {loadingCoordinates ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Obteniendo coordenadas...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Obtener coordenadas desde dirección
                  </>
                )}
              </Button>
              {(!formData.address || !formData.city) && (
                <p className="text-xs text-muted-foreground">
                  Completa la dirección y ciudad para obtener las coordenadas
                </p>
              )}
            </CardContent>
          </Card>

          {/* Características */}
          <Card>
            <CardHeader>
              <CardTitle>Características</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Habitaciones</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bedrooms: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="bathrooms">Baños</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bathrooms: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="area_m2">Área (m²) *</Label>
                  <Input
                    id="area_m2"
                    type="number"
                    value={formData.area_m2 || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        area_m2: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  {errors.area_m2 && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.area_m2}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="furnished"
                    checked={furnished}
                    onCheckedChange={(checked) => setFurnished(checked as boolean)}
                  />
                  <Label htmlFor="furnished" className="cursor-pointer">
                    Amoblado
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pets"
                    checked={petsAllowed}
                    onCheckedChange={(checked) =>
                      setPetsAllowed(checked as boolean)
                    }
                  />
                  <Label htmlFor="pets" className="cursor-pointer">
                    Acepta mascotas
                  </Label>
                </div>
              </div>

              <div>
                <Label>Amenidades</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {commonAmenities.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity}
                        checked={amenities.includes(amenity)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAmenities([...amenities, amenity]);
                          } else {
                            setAmenities(amenities.filter((a) => a !== amenity));
                          }
                        }}
                      />
                      <Label htmlFor={amenity} className="cursor-pointer text-sm">
                        {amenity}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fotos */}
          <Card>
            <CardHeader>
              <CardTitle>Fotos de la propiedad *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="images">
                  Sube hasta 10 imágenes (máx 5MB c/u)
                </Label>
                <div className="mt-2">
                  <label
                    htmlFor="images"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent"
                  >
                    {uploadingImages ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Click para subir imágenes
                        </p>
                      </div>
                    )}
                  </label>
                  <Input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImages}
                  />
                </div>
              </div>

              {images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Click en la estrella para marcar como foto de portada
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        
                        {/* Indicador de portada */}
                        {index === coverImageIndex && (
                          <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Portada
                          </div>
                        )}
                        
                        {/* Botón para marcar como portada */}
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className={`absolute top-2 left-2 transition-opacity ${
                            index === coverImageIndex 
                              ? 'opacity-0' 
                              : 'opacity-0 group-hover:opacity-100'
                          }`}
                          onClick={() => setCoverImage(index)}
                          title="Marcar como portada"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                        
                        {/* Botón eliminar */}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : id ? (
                'Actualizar Propiedad'
              ) : (
                'Publicar Propiedad'
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateProperty;
