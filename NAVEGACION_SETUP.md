# Configuración de Navegación GPS

## Variables de Entorno Requeridas

Ya configuradas en `.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyCXAuPsvqOlEA92NB8zrMHCJdVDbhenwgE
VITE_SUPABASE_URL=https://aanpeccuaukzrxaoubmh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
```

### Configuración de Google Maps API

La clave ya está configurada con las siguientes bibliotecas habilitadas:
- ✅ Maps JavaScript API
- ✅ Places API
- ✅ Directions API
- ✅ Routes API (opcional, para polylines optimizadas)

**Restricciones recomendadas:**
1. En Google Cloud Console, ir a: APIs & Services > Credentials
2. Editar la API key y configurar:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: `*.lovable.app/*`, `localhost/*`
   - **API restrictions**: Limitar a las APIs listadas arriba

## Edge Functions Desplegadas

### 1. `rentals-nearby`
**Endpoint**: `GET /functions/v1/rentals-nearby`

**Parámetros**:
- `lat` (required): Latitud
- `lon` (required): Longitud  
- `radius` (optional): Radio en metros (default: 300)
- `priceMax` (optional): Precio máximo
- `type` (optional): Tipo de propiedad (all, apartment, house, commercial)

**Respuesta**: GeoJSON FeatureCollection con propiedades cercanas

### 2. `rentals-route`
**Endpoint**: `POST /functions/v1/rentals-route`

**Body**:
```json
{
  "route_geojson": {
    "type": "LineString",
    "coordinates": [[lng, lat], ...]
  },
  "buffer_m": 150,
  "priceMax": 2500000,
  "types": ["apartment", "house"]
}
```

**Respuesta**: GeoJSON FeatureCollection con propiedades a lo largo de la ruta

### 3. `transcribe-audio`
**Endpoint**: `POST /functions/v1/transcribe-audio`

**Body**:
```json
{
  "audio": "base64_encoded_webm"
}
```

**Respuesta**:
```json
{
  "text": "apartamento de 2 habitaciones cerca del metro"
}
```

### 4. `interpret-search`
**Endpoint**: `POST /functions/v1/interpret-search`

**Body**:
```json
{
  "query": "apartamento grande con parqueadero"
}
```

**Respuesta**:
```json
{
  "filters": {
    "propertyType": "apartment",
    "bedrooms": 3,
    "maxPrice": 3000000,
    "radius": 5
  }
}
```

## Arquitectura de Navegación

### 1. Inicialización del Mapa
```javascript
// Mapa se inicializa con tilt 3D y heading
map.setTilt(45);
map.setHeading(0);
map.setOptions({
  disableDefaultUI: true,
  gestureHandling: 'greedy'
});
```

### 2. Seguimiento GPS
```javascript
// watchPosition con throttle dinámico
navigator.geolocation.watchPosition(
  position => {
    const speed = calculateSpeed(position);
    
    // Throttle basado en velocidad:
    // >8 m/s = 2s
    // 2-8 m/s = 3s  
    // <2 m/s = 5s
    
    if (shouldUpdate(speed)) {
      updateMapAndFetch(position);
    }
  },
  { enableHighAccuracy: true }
);
```

### 3. Actualización de Propiedades
```javascript
// Debounced fetch con caché de 30s
const refreshNearby = debounce(async () => {
  const geojson = await getCachedNearbyProperties({
    lat: userLocation.lat,
    lon: userLocation.lng,
    radius: searchRadius,
    priceMax: filters.maxPrice,
    type: filters.propertyType
  });
  
  renderProperties(geojson);
}, 350);
```

### 4. Modo Ruta (Corredor)
```javascript
// Obtener polyline de Directions API
const route = await getDirections(origin, destination);
const polyline = route.routes[0].overview_polyline.points;

// Convertir a GeoJSON y buscar propiedades
const geojson = encodePolylineToGeoJSON(polyline);
const properties = await fetchRouteProperties({
  route_geojson: geojson,
  buffer_m: 150,
  priceMax: 3000000
});
```

### 5. Sistema de Alertas
```javascript
// Score de propiedades (0-100)
const score = calculateScore(property, {
  priceMax: 3000000,     // 40 puntos
  bedrooms: 2,           // 30 puntos
  propertyType: 'apt',   // 20 puntos
  distance: 500          // 10 puntos
});

// Alertar si score >= 70 y no alertado en últimos 15 min
if (score >= 70 && shouldShowAlert(property.id)) {
  showPropertyAlert(property); // Toast + Web Notification
}
```

### 6. Búsqueda por Voz
```javascript
// 1. Capturar audio (4 segundos)
const recorder = new MediaRecorder(stream);
recorder.start();
setTimeout(() => recorder.stop(), 4000);

// 2. Transcribir
const { text } = await transcribeAudio(audioBlob);

// 3. Parsear filtros
const filters = parseVoice(text);
// "2 hab cerca del poblado" → { bedrooms: 2, location: "poblado" }

// 4. Geocodificar ubicación si existe
if (filters.location) {
  const coords = await geocode(filters.location);
  map.panTo(coords);
}

// 5. Aplicar filtros y buscar
applyFilters(filters);
refreshNearby();
```

## Optimizaciones Implementadas

### Caché
- **Propiedades cercanas**: 30s por cuadrante/zoom
- **Máximo 10 entradas** en caché, limpieza automática

### Throttling
- **watchPosition**: 2-5s según velocidad
- **onIdle del mapa**: 350ms debounce
- **Fetch de propiedades**: máximo cada 30s con caché

### Clustering
- MarkerClusterer para >20 propiedades
- AdvancedMarker individual en zoom alto con precio

### Modo Conducción
- Detecta velocidad >20 km/h
- Bloquea pantalla por seguridad
- Guarda propiedades automáticamente
- Muestra revisión al detenerse

## Validación de Errores

El sistema detecta y loguea:
- ❌ Billing no configurado en Google Cloud
- ❌ APIs no habilitadas
- ❌ Restricciones de referrer incorrectas
- ❌ Errores de geolocalización
- ❌ Permisos de micrófono/notificaciones

Todos los errores se muestran con toasts informativos al usuario.

## Testing

### Probar navegación básica:
1. Ir a `/navegacion?query=apartamento&autostart=true`
2. Permitir ubicación GPS
3. Verificar que aparezcan propiedades en radio de 200m
4. Mover slider de radio, verificar actualización

### Probar búsqueda por voz:
1. Click en botón micrófono
2. Decir: "apartamento de 2 habitaciones en el poblado"
3. Verificar transcripción y aplicación de filtros

### Probar modo conducción:
1. Simular velocidad >20 km/h (o usar coche real)
2. Verificar overlay de bloqueo
3. Pasar cerca de propiedades
4. Detenerse y verificar pantalla de revisión

## Próximas Mejoras

- [ ] Integrar MarkerClusterer visual
- [ ] Agregar chips de filtro en UI
- [ ] Implementar Places Autocomplete visual
- [ ] Mejorar visualización de rutas con polylines
- [ ] Agregar estadísticas de recorrido
- [ ] Implementar historial de búsquedas