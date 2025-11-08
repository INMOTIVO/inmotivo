export interface Location {
  department: string;
  municipalities: {
    name: string;
    neighborhoods: string[];
  }[];
}

// Datos completos de Colombia - Departamentos, Municipios y Barrios
export const colombiaLocations: Location[] = [
  {
    department: "Antioquia",
    municipalities: [
      { name: "Medellín", neighborhoods: ["El Poblado", "Laureles", "Envigado Centro", "Belén", "Buenos Aires", "La Candelaria", "Robledo", "Estadio", "Aranjuez", "La América", "Manrique", "Santa Cruz", "Castilla", "Villa Hermosa", "Guayabal", "San Javier", "Popular", "Santo Domingo Savio"] },
      { name: "Bello", neighborhoods: ["Niquía", "Fontidueño", "La Madera", "Cabañas", "Suárez", "París", "Guadalupe", "Acevedo", "Santa Ana", "La Cumbre"] },
      { name: "Envigado", neighborhoods: ["Envigado Centro", "La Paz", "Alcalá", "Otra Parte", "Zuniga", "Loma del Escobero", "Mesa"] },
      { name: "Itagüí", neighborhoods: ["Centro", "San Pío", "Santa María", "Ditaires", "Suramérica", "Olivares", "Fátima"] },
      { name: "Rionegro", neighborhoods: ["Centro", "Llanogrande", "San Antonio de Pereira", "La Convención", "Barro Blanco"] },
      { name: "Sabaneta", neighborhoods: ["Centro", "Cañaveralejo", "San José", "Las Casitas", "Holanda"] },
      { name: "La Estrella", neighborhoods: ["Centro", "La Tablaza", "Pueblo Viejo", "San José"] },
      { name: "Girardota", neighborhoods: ["Centro", "Hatillo", "La Mosca", "El Tambo"] },
      { name: "Copacabana", neighborhoods: ["Centro", "La Paz", "Niquia", "La Veta"] },
      { name: "Caldas", neighborhoods: ["Centro", "La Chinca", "La Quiebra", "La Salada"] },
      { name: "Apartadó", neighborhoods: ["Centro", "El Reposo", "Popular", "Pablo VI"] },
      { name: "Turbo", neighborhoods: ["Centro", "El Poblado", "Veranillo", "Los Córdobas"] },
      { name: "Caucasia", neighborhoods: ["Centro", "Bolívar", "Cristo Rey", "La Paz"] },
      { name: "Marinilla", neighborhoods: ["Centro", "Santa Elena", "La Mesa", "San Lorenzo"] },
      { name: "Carmen de Viboral", neighborhoods: ["Centro", "La Chapa", "El Totumo", "La Milagrosa"] },
      { name: "La Ceja", neighborhoods: ["Centro", "San Luis", "La Inmaculada", "El Capiro"] }
    ]
  },
  {
    department: "Atlántico",
    municipalities: [
      { name: "Barranquilla", neighborhoods: ["El Prado", "Riomar", "Boston", "El Country", "Villa Santos", "El Poblado", "Alto Prado", "La Concepción", "Bellavista", "Las Flores", "Ciudad Jardín", "El Golf", "Los Nogales", "Altos del Limón", "Paraíso", "Villa Carolina", "Los Andes", "El Recreo", "San Vicente", "Simón Bolívar", "La Paz", "El Bosque", "La Victoria", "Rebolo", "Barlovento", "Bellas Artes", "Olaya", "Montecristo", "Las Malvinas", "San Roque", "Centro"] },
      { name: "Soledad", neighborhoods: ["Centro", "La Central", "El Ferrocarril", "Ciudadela 20 de Julio", "Villa Estadio", "Mequejo", "La Arboleda", "Juan XXIII", "Villa Katanga", "El Bosque", "Metropolitano"] },
      { name: "Malambo", neighborhoods: ["Centro", "Pueblo Nuevo", "La Playa", "Aguada", "Villa Marbella", "Los Almendros"] },
      { name: "Puerto Colombia", neighborhoods: ["Centro", "Salgar", "Pradomar", "Sabanilla", "Miramar", "Villa Campestre"] },
      { name: "Galapa", neighborhoods: ["Centro", "Villa Rosa", "San Antonio", "Nueva Galapa", "La Pradera", "El Progreso"] },
      { name: "Sabanalarga", neighborhoods: ["Centro", "El Progreso", "7 de Agosto", "Prado", "San Roque"] },
      { name: "Baranoa", neighborhoods: ["Centro", "La Victoria", "El Carmen", "San Antonio"] },
      { name: "Sabanagrande", neighborhoods: ["Centro", "El Porvenir", "Villa del Rosario", "El Prado"] },
      { name: "Santo Tomás", neighborhoods: ["Centro", "El Porvenir", "El Carmen", "Villanueva"] },
      { name: "Polonuevo", neighborhoods: ["Centro", "La Esperanza", "Villa María", "El Progreso"] }
    ]
  },
  {
    department: "Bogotá, D.C.",
    municipalities: [
      { name: "Bogotá", neighborhoods: ["Chapinero", "Usaquén", "Suba", "Engativá", "Fontibón", "Kennedy", "Teusaquillo", "Candelaria", "Santa Fe", "San Cristóbal", "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz", "Puente Aranda", "Los Mártires", "Antonio Nariño", "Bosa", "Tunjuelito", "Barrios Unidos", "Chicó", "Rosales", "Cedritos", "Modelia", "Hayuelos", "Tintal", "Portal de las Américas", "Patio Bonito", "Corabastos", "El Tunal", "Restrepo", "El Quiroga", "San Benito", "La Perseverancia", "Las Aguas", "La Macarena", "El Centro Internacional", "Santa Bárbara", "Normandía", "El Contador", "Los Alcázares", "Niza", "Colina Campestre", "San Antonio Norte", "Rincón del Chicó"] }
    ]
  },
  {
    department: "Bolívar",
    municipalities: [
      { name: "Cartagena", neighborhoods: ["Bocagrande", "Castillogrande", "El Laguito", "Manga", "Getsemaní", "Centro Histórico", "Crespo", "Pie de la Popa", "El Cabrero", "Pie del Cerro", "Chambacú", "Torices", "Escallon Villa", "España", "La Matuna", "San Diego", "Marbella", "El Bosque", "Villa Estrella", "Boston", "El Pozón", "Olaya Herrera", "Nelson Mandela", "Bayunca", "Pasacaballos"] },
      { name: "Turbaco", neighborhoods: ["Centro", "Ararca", "Gambote", "Varadero", "Membrillal", "Ballestas", "Villa Hermosa", "La Granja"] },
      { name: "Magangué", neighborhoods: ["Centro", "Pueblo Nuevo", "Santa Ana", "Las Mercedes", "El Contento", "La Esperanza"] },
      { name: "El Carmen de Bolívar", neighborhoods: ["Centro", "La Peña", "San Isidro", "Caracolí", "El Carmelo", "La Esperanza"] },
      { name: "Arjona", neighborhoods: ["Centro", "La Libertad", "El Retiro", "Villa Fátima"] },
      { name: "Santa Rosa del Sur", neighborhoods: ["Centro", "El Prado", "La Esperanza", "Popular"] },
      { name: "Mompox", neighborhoods: ["Centro Histórico", "Santa Bárbara", "San Carlos", "San Juan de Dios"] },
      { name: "Simití", neighborhoods: ["Centro", "La Paz", "El Progreso", "La Unión"] }
    ]
  },
  {
    department: "Boyacá",
    municipalities: [
      { name: "Tunja", neighborhoods: ["Centro", "San Lázaro", "Santa Inés", "Muiscas", "El Recreo", "Mesopotamia", "Pueblito Boyacense", "La Esmeralda", "Kennedy"] },
      { name: "Duitama", neighborhoods: ["Centro", "La Floresta", "Pueblo Viejo", "Santa Rita", "La Gruta", "El Carmen", "Berlín"] },
      { name: "Sogamoso", neighborhoods: ["Centro", "La Florida", "Mochacá", "El Rosario", "Villa del Rosario", "San Martín", "Monquirá"] },
      { name: "Chiquinquirá", neighborhoods: ["Centro", "La Aurora", "San Cayetano", "El Limón", "Villa Nueva"] },
      { name: "Paipa", neighborhoods: ["Centro", "El Salitre", "La Playa", "Pantano de Vargas"] },
      { name: "Villa de Leyva", neighborhoods: ["Centro Histórico", "El Carmen", "San Agustín", "Ritoque"] }
    ]
  },
  {
    department: "Caldas",
    municipalities: [
      { name: "Manizales", neighborhoods: ["Centro", "Cable", "Fátima", "Palermo", "Milán", "La Francia", "Chipre", "Colón", "Estrada", "La Sultana", "Villa Hermosa", "Palogrande", "San José", "Ciudadela del Norte", "Los Cámbulos", "Alta Suiza", "El Caribe"] },
      { name: "Chinchiná", neighborhoods: ["Centro", "La Pradera", "San Pablo", "La Estrella", "Villa Liliana"] },
      { name: "La Dorada", neighborhoods: ["Centro", "La Playita", "Calle Real", "Kennedy", "El Retiro"] },
      { name: "Villamaría", neighborhoods: ["Centro", "Maltería", "El Cable", "Gallinazo", "San Julián"] },
      { name: "Riosucio", neighborhoods: ["Centro", "La Esmeralda", "San Lorenzo", "La Solita"] },
      { name: "Anserma", neighborhoods: ["Centro", "La Floresta", "El Jardín", "Bellavista"] }
    ]
  },
  {
    department: "Caquetá",
    municipalities: [
      { name: "Florencia", neighborhoods: ["Centro", "El Torasso", "La Vega", "El Progreso", "La Esperanza", "7 de Agosto", "Galán", "Los Pinos", "La Pradera"] },
      { name: "San Vicente del Caguán", neighborhoods: ["Centro", "Villa Colombia", "El Jardín", "La Unión"] },
      { name: "Puerto Rico", neighborhoods: ["Centro", "La Libertad", "El Porvenir"] }
    ]
  },
  {
    department: "Cauca",
    municipalities: [
      { name: "Popayán", neighborhoods: ["Centro", "El Empedrado", "La Esmeralda", "La Estancia", "Alfonso López", "Caldono", "Los Robles", "Bello Horizonte", "Lourdes", "Las Ferias", "La Campiña", "San José", "Villa del Norte", "Los Hoyos"] },
      { name: "Santander de Quilichao", neighborhoods: ["Centro", "La Palma", "Versalles", "La Independencia"] },
      { name: "El Bordo", neighborhoods: ["Centro", "El Trapiche", "Coconuco"] },
      { name: "Piendamó", neighborhoods: ["Centro", "La Meseta", "El Carmelo"] },
      { name: "Puerto Tejada", neighborhoods: ["Centro", "Villa Rica", "Guachené", "La Playa"] }
    ]
  },
  {
    department: "Cesar",
    municipalities: [
      { name: "Valledupar", neighborhoods: ["Centro", "La Nevada", "El Popular", "Los Fundadores", "La Esperanza", "Alfonso López", "Santa Isabel", "Villa Rosita", "La Paz", "Sabanas", "Los Andes", "La Gran Via", "Villa Germania"] },
      { name: "Aguachica", neighborhoods: ["Centro", "El Oasis", "La Unión", "La Pradera", "El Progreso"] },
      { name: "Bosconia", neighborhoods: ["Centro", "Santa Lucía", "El Jardín"] },
      { name: "Agustín Codazzi", neighborhoods: ["Centro", "Casacará", "El Llanito"] },
      { name: "La Jagua de Ibirico", neighborhoods: ["Centro", "El Plan", "Zona Minera"] }
    ]
  },
  {
    department: "Chocó",
    municipalities: [
      { name: "Quibdó", neighborhoods: ["Centro", "Kennedy", "Pandeyuca", "Roma", "La Yesquita", "Niño Jesús", "El Silencio", "La Aurora"] },
      { name: "Istmina", neighborhoods: ["Centro", "San Pedro", "Santa Rita"] },
      { name: "Condoto", neighborhoods: ["Centro", "La Bocana", "San José"] },
      { name: "Nuquí", neighborhoods: ["Centro", "Playa Guachalito", "Termales"] }
    ]
  },
  {
    department: "Córdoba",
    municipalities: [
      { name: "Montería", neighborhoods: ["Centro", "La Granja", "Villa Jimenez", "Cantaclaro", "Pasatiempo", "El Poblado", "La Castellana", "El Recreo", "La Pradera", "El Dorado", "Mogambo", "P-5", "Rancho Grande", "Buenavista", "Paz del Río"] },
      { name: "Sahagún", neighborhoods: ["Centro", "La Esperanza", "El Prado", "Villa Mery"] },
      { name: "Cereté", neighborhoods: ["Centro", "La Granja", "Mogambo", "El Paraíso"] },
      { name: "Lorica", neighborhoods: ["Centro", "La Pola", "20 de Enero", "El Reposo"] },
      { name: "Planeta Rica", neighborhoods: ["Centro", "Villa Jiménez", "Kennedy"] }
    ]
  },
  {
    department: "Cundinamarca",
    municipalities: [
      { name: "Soacha", neighborhoods: ["Centro", "Compartir", "Ciudadela Sucre", "San Mateo", "León XIII", "Altos de la Florida", "Ciudad Verde", "San Humberto", "Ducales", "Villa Esperanza", "Terreros", "El Oasis"] },
      { name: "Chía", neighborhoods: ["Centro", "Bojacá", "Fonquetá", "Cerca de Piedra", "La Balsa", "Fagua", "Yerbabuena", "Santa Lucía", "Tíquiza", "San José"] },
      { name: "Zipaquirá", neighborhoods: ["Centro", "Barandillas", "San Carlos", "Portones", "Julio Caro", "San Juanito", "San Miguel", "La Paz", "Julio Flórez", "El Eucalipto"] },
      { name: "Facatativá", neighborhoods: ["Centro", "El Jardín", "Santa Marta", "Pueblo Viejo", "La Esmeralda", "El Corzo", "Manablanca", "La Moya", "Santa Bárbara"] },
      { name: "Cajicá", neighborhoods: ["Centro", "Calahorra", "Chuntame", "Río Grande", "La Palma", "El Misterio", "Capellanía"] },
      { name: "Madrid", neighborhoods: ["Centro", "San Fernando", "La Caro", "Sector Industrial", "Santa María del Río", "El Porvenir"] },
      { name: "Funza", neighborhoods: ["Centro", "Casablanca", "La Feria", "Serrezuela", "Prados de Funza", "El Hato"] },
      { name: "Mosquera", neighborhoods: ["Centro", "San Nicolás", "La Florida", "Serrezuela", "Santa María", "Ciudad Sabana"] },
      { name: "Fusagasugá", neighborhoods: ["Centro", "El Caney", "La Marichuela", "Pasquilla", "Obrero", "Luxemburgo", "Pablo VI", "El Resguardo", "Santa María"] },
      { name: "Girardot", neighborhoods: ["Centro", "Kennedy", "Villa Gladys", "Pueblo Nuevo", "La Esmeralda", "Barzalosa"] },
      { name: "Sopó", neighborhoods: ["Centro", "San Gabriel", "Aposentos", "Hato Grande", "La Diana"] },
      { name: "La Calera", neighborhoods: ["Centro", "El Salitre", "Mundo Nuevo", "La Ramada"] },
      { name: "Tocancipá", neighborhoods: ["Centro", "Verganzo", "Canavita", "Tibitó", "La Fuente"] },
      { name: "Tabio", neighborhoods: ["Centro", "Punta Larga", "Carrón", "Llano Grande"] },
      { name: "Tenjo", neighborhoods: ["Centro", "Chince", "El Estanco", "Poveda"] }
    ]
  },
  {
    department: "Huila",
    municipalities: [
      { name: "Neiva", neighborhoods: ["Centro", "Cándido", "Las Palmas", "Altico", "Las Ceibas", "La Gaitana", "El Jardín", "Los Libertadores", "Siete de Agosto", "Panorama", "Granjas", "Mipueblo", "La Floresta", "El Recreo", "Calixto Leiva"] },
      { name: "Pitalito", neighborhoods: ["Centro", "San Agustín", "Tinajas", "Criollo", "La Esmeralda"] },
      { name: "Garzón", neighborhoods: ["Centro", "La Jagua", "Potrerito", "El Vergel"] },
      { name: "La Plata", neighborhoods: ["Centro", "San Sebastián", "El Jardín"] },
      { name: "Campoalegre", neighborhoods: ["Centro", "El Triunfo", "Neiva"] }
    ]
  },
  {
    department: "La Guajira",
    municipalities: [
      { name: "Riohacha", neighborhoods: ["Centro", "El Prado", "La Florida", "Los Remedios", "Marbella", "Majayura", "Comfamiliar", "Almirante Padilla", "La Paz"] },
      { name: "Maicao", neighborhoods: ["Centro", "Los Andes", "Villa Fátima", "Kennedy", "El Porvenir"] },
      { name: "Uribia", neighborhoods: ["Centro", "Puerto López", "Nazareth"] },
      { name: "Fonseca", neighborhoods: ["Centro", "El Hatillo", "Villa Fátima"] },
      { name: "San Juan del Cesar", neighborhoods: ["Centro", "Los Andes", "Villa Nueva"] }
    ]
  },
  {
    department: "Magdalena",
    municipalities: [
      { name: "Santa Marta", neighborhoods: ["Centro", "El Rodadero", "Gaira", "Mamatoco", "Bello Horizonte", "Taganga", "La Quinta", "Bastidas", "Porvenir", "Manzanares", "Los Almendros", "El Prado", "Los Trupillos", "El Jardín"] },
      { name: "Ciénaga", neighborhoods: ["Centro", "4 de Julio", "La Lucha", "Olaya Herrera"] },
      { name: "Fundación", neighborhoods: ["Centro", "La Paz", "El Carmen", "Sevilla"] },
      { name: "Zona Bananera", neighborhoods: ["Centro", "Guacamayal", "Orihueca", "Soplador"] },
      { name: "Plato", neighborhoods: ["Centro", "Bellavista", "El Prado"] }
    ]
  },
  {
    department: "Meta",
    municipalities: [
      { name: "Villavicencio", neighborhoods: ["Centro", "La Esperanza", "Porfía", "Barzal", "San Fernando", "Camoa", "La Grama", "Cofrem", "Marandúa", "Poblado I", "Poblado II", "La Castellana", "Villa Julia", "Villa Colombia", "El Emporio", "Las Ferias", "El Triunfo", "Brisas del Guatiquia"] },
      { name: "Acacías", neighborhoods: ["Centro", "La Paz", "San Miguel", "Santa Elena"] },
      { name: "Granada", neighborhoods: ["Centro", "Villa Angélica", "Simón Bolívar"] },
      { name: "San Martín", neighborhoods: ["Centro", "La Libertad", "El Porvenir"] },
      { name: "Puerto López", neighborhoods: ["Centro", "La Playita", "Campamento"] }
    ]
  },
  {
    department: "Nariño",
    municipalities: [
      { name: "Pasto", neighborhoods: ["Centro", "Santiago", "Prado", "Miraflores", "Jongovito", "Aranda", "San Vicente", "Belalcázar", "La Rosa", "Tejar", "Fátima", "San Felipe", "Torobajo", "El Rosario", "Tamasagra", "Cujacal", "El Encano"] },
      { name: "Tumaco", neighborhoods: ["Centro", "La Floridablanca", "La Ciudadela", "El Morro", "Viento Libre", "El Bajito", "El Triunfo", "El Carmen"] },
      { name: "Ipiales", neighborhoods: ["Centro", "La Victoria", "San Vicente", "Las Lajas", "Rumichaca"] },
      { name: "Túquerres", neighborhoods: ["Centro", "San Rafael", "La Pradera"] }
    ]
  },
  {
    department: "Norte de Santander",
    municipalities: [
      { name: "Cúcuta", neighborhoods: ["Centro", "Caobos", "La Playa", "Colsag", "San Luis", "La Libertad", "Atalaya", "Lleras", "San Rafael", "Kennedy", "Aniversario", "La Ermita", "La Primavera", "Callejón", "Prados del Norte", "La Floresta", "El Bosque", "San Eduardo", "Urdaneta", "Quinta Oriental"] },
      { name: "Ocaña", neighborhoods: ["Centro", "La Primavera", "El Carmen", "La Macarena"] },
      { name: "Pamplona", neighborhoods: ["Centro", "El Humilladero", "La Universidad"] },
      { name: "Villa del Rosario", neighborhoods: ["Centro", "La Parada", "Villa Rosita", "Motilones"] },
      { name: "Los Patios", neighborhoods: ["Centro", "La Garita", "Buena Esperanza"] }
    ]
  },
  {
    department: "Quindío",
    municipalities: [
      { name: "Armenia", neighborhoods: ["Centro", "La Fachada", "Zuldemayda", "Quimbaya", "Los Naranjos", "Bosques de Pinares", "La Castellana", "Alfonso López", "Las Colinas", "Portal del Edén", "Ciudadela del Café", "La Secreta", "La Avanzada", "Uribe", "La Esperanza", "Villa del Prado", "Patio Bonito"] },
      { name: "Calarcá", neighborhoods: ["Centro", "La Bella", "Villa Ligia", "San José", "El Caimo", "Samaria", "El Danubio", "Dosquebradas"] },
      { name: "Montenegro", neighborhoods: ["Centro", "Pueblo Tapao", "El Vergel", "La Esmeralda", "Villa Natalia", "Santa Isabel"] },
      { name: "Circasia", neighborhoods: ["Centro", "La Virginia", "Buenavista", "Berlín", "Villa Ligia"] },
      { name: "La Tebaida", neighborhoods: ["Centro", "Chaparral", "Santa Eduviges", "Florida", "Villa del Prado"] },
      { name: "Quimbaya", neighborhoods: ["Centro", "Cruces", "Puerto Alejandría", "La Esmeralda", "El Caimo"] },
      { name: "Filandia", neighborhoods: ["Centro", "La Estrella", "Cruces", "Barranquilla"] }
    ]
  },
  {
    department: "Risaralda",
    municipalities: [
      { name: "Pereira", neighborhoods: ["Centro", "Álamos", "Cuba", "La Circunvalar", "Olímpica", "Pío XII", "El Poblado", "Pinares de San Martín", "Boston", "Centenario", "Villa Santana", "Ferrocarril", "San Nicolás", "El Jardín", "Ciudadela Tokio", "Kennedy", "El Danubio", "Mejía Robledo", "La Victoria", "El Rocío", "Villavicencio", "San Fernando", "Málaga", "El Plumón"] },
      { name: "Dosquebradas", neighborhoods: ["Centro", "Frailes", "Palma de Oro", "Santa Teresita", "La Esneda", "El Japón", "Betania", "Los Álamos", "La Popa", "Villa Luz", "Bosques de la Acuarela"] },
      { name: "La Virginia", neighborhoods: ["Centro", "Bombay", "Villa Pilar", "Samaria", "El Bosque", "La Platanera"] },
      { name: "Santa Rosa de Cabal", neighborhoods: ["Centro", "La Capilla", "El Español", "Termales", "La Unión", "La Montaña", "Brisas de Santa Rosa"] },
      { name: "Marsella", neighborhoods: ["Centro", "El Trapiche", "San Isidro", "La Molina"] },
      { name: "Belén de Umbría", neighborhoods: ["Centro", "El Bosque", "La Selva", "Villa Nueva"] }
    ]
  },
  {
    department: "Santander",
    municipalities: [
      { name: "Bucaramanga", neighborhoods: ["Cabecera del Llano", "El Prado", "Álamos", "San Francisco", "Centro", "La Aurora", "Provenza", "Lagos del Cacique", "Sotomayor", "Morrorico", "García Rovira", "La Cumbre", "Real de Minas", "La Floresta", "Terrazas", "Los Cedros", "Cañaveral", "La Juventud", "Toledo Plata", "Campo Hermoso", "Antonia Santos", "El Bosque", "La Victoria", "San Martín", "Alfonso López"] },
      { name: "Floridablanca", neighborhoods: ["Centro", "Cañaveral", "Lagos I", "Altos de Bellavista", "Villabel", "Ruitoque", "El Bosque", "San Expedito", "Conucos", "La Cumbre", "Ciudadela Real de Minas"] },
      { name: "Piedecuesta", neighborhoods: ["Centro", "El Recreo", "Guatiguará", "La Esperanza", "Alto de Pamplona", "Alfonso López", "El Bueno", "Los Cauchos", "Santa Teresa", "Villa Rosario"] },
      { name: "Girón", neighborhoods: ["Centro", "La Esmeralda", "Kennedy", "Llano de Palmas", "Rincón", "El Poblado", "Villa Blanca", "Versalles", "El Rhin"] },
      { name: "San Gil", neighborhoods: ["Centro", "Cabecera", "Calle Real", "Pueblo Nuevo", "El Poblado", "La Granja"] },
      { name: "Barrancabermeja", neighborhoods: ["Centro", "La Victoria", "El Campín", "La Paz", "Boston", "El Cincuentenario", "Pueblo Nuevo", "Kennedy", "Primero de Mayo", "Miraflores"] },
      { name: "Socorro", neighborhoods: ["Centro", "El Poblado", "Santa Bárbara", "San Roque"] }
    ]
  },
  {
    department: "Sucre",
    municipalities: [
      { name: "Sincelejo", neighborhoods: ["Centro", "La Majagua", "Villa Paraíso", "La Granja", "El Prado", "Mochila", "El Cortijo", "Bruselas", "Cevillar", "Bongo", "Villa Altagracia", "Santa Fe", "Colina Real"] },
      { name: "Corozal", neighborhoods: ["Centro", "El Carmen", "La Granja", "El Prado"] },
      { name: "Sampués", neighborhoods: ["Centro", "El Carmelo", "Villa Nueva"] },
      { name: "Tolú", neighborhoods: ["Centro", "Playa", "Pita en Medio"] }
    ]
  },
  {
    department: "Tolima",
    municipalities: [
      { name: "Ibagué", neighborhoods: ["Centro", "La Pola", "Salado", "Restrepo", "San Simón", "Ambalá", "Picaleña", "Jordán", "Topacio", "La Florida", "El Vergel", "Mirolindo", "Gavilán", "Cádiz", "El Recreo", "San Antonio", "Cañaverales", "Villa Restrepo", "Altos de Jordán"] },
      { name: "Espinal", neighborhoods: ["Centro", "La Independencia", "Villa Natalia", "Los Guaduales"] },
      { name: "Melgar", neighborhoods: ["Centro", "Villa Carmen", "El Recreo", "Portal del Café"] },
      { name: "Girardot", neighborhoods: ["Centro", "Kennedy", "Villa Gladys", "Pueblo Nuevo"] },
      { name: "Honda", neighborhoods: ["Centro", "Molinos", "Palogrande", "Buenavista"] },
      { name: "Chaparral", neighborhoods: ["Centro", "Villa Nueva", "La Libertad"] }
    ]
  },
  {
    department: "Valle del Cauca",
    municipalities: [
      { name: "Cali", neighborhoods: ["San Fernando", "El Peñón", "Granada", "Ciudad Jardín", "Normandía", "Limonar", "Santa Mónica", "El Ingenio", "Menga", "Tequendama", "Santa Anita", "Versalles", "San Antonio", "Santa Rita", "Flora Industrial", "Alfonso López", "Aguablanca", "Juanchito", "Alameda", "Salomia", "La Merced", "El Lido", "Centenario", "Chipichape", "Pance", "La Hacienda", "Unicentro", "El Refugio", "La Flora", "Tejares", "Llano Verde", "Potrero Grande", "Marroquín"] },
      { name: "Palmira", neighborhoods: ["Centro", "El Sembrador", "La Emilia", "Zamorano", "La Carbonera", "El Nogal", "El Placer", "Bolivariano", "La Torre", "Belalcázar"] },
      { name: "Buenaventura", neighborhoods: ["Centro", "Bellavista", "El Piñal", "Muro Yusti", "La Playita", "San Antonio", "Vientos Libres", "La Victoria", "Alfonso López", "San José"] },
      { name: "Yumbo", neighborhoods: ["Centro", "San Marcos", "Brisas de los Álamos", "El Cortijo", "Belalcázar", "Villa Luz", "Navegantes"] },
      { name: "Jamundí", neighborhoods: ["Centro", "Bocas del Palo", "Villa Paz", "Timba", "Piedra de Moler", "La Liberia"] },
      { name: "Tuluá", neighborhoods: ["Centro", "Santa Elena", "San Rafael", "La María", "Matamoros", "Alvernia", "San Carlos", "Barrancas", "El Jardín"] },
      { name: "Cartago", neighborhoods: ["Centro", "Santa Cecilia", "Alfonso López", "Los Ángeles", "Matadero", "Santa Rosa"] },
      { name: "Buga", neighborhoods: ["Centro", "San Gerardo", "La Libertad", "Nuevo Milenio", "Chapinero"] }
    ]
  },
  {
    department: "Arauca",
    municipalities: [
      { name: "Arauca", neighborhoods: ["Centro", "La Esperanza", "El Triunfo", "Las Américas", "Alfonso López", "Villa del Prado"] },
      { name: "Tame", neighborhoods: ["Centro", "La Libertad", "El Porvenir"] },
      { name: "Saravena", neighborhoods: ["Centro", "Las Américas", "Villa Nueva"] }
    ]
  },
  {
    department: "Casanare",
    municipalities: [
      { name: "Yopal", neighborhoods: ["Centro", "La Campiña", "Villa Milena", "Los Libertadores", "El Paraíso", "Simón Bolívar", "La Granja", "La Florida", "Rincón de Lata", "El Recreo"] },
      { name: "Aguazul", neighborhoods: ["Centro", "Nueva Colombia", "Villa del Prado"] },
      { name: "Villanueva", neighborhoods: ["Centro", "Las Américas", "La Unión"] },
      { name: "Monterrey", neighborhoods: ["Centro", "San José", "El Porvenir"] }
    ]
  },
  {
    department: "Putumayo",
    municipalities: [
      { name: "Mocoa", neighborhoods: ["Centro", "San Carlos", "Villa Nueva", "La Libertad", "San Agustín"] },
      { name: "Puerto Asís", neighborhoods: ["Centro", "La Esperanza", "El Porvenir"] },
      { name: "Orito", neighborhoods: ["Centro", "Villa del Sol", "La Unión"] }
    ]
  },
  {
    department: "San Andrés, Providencia y Santa Catalina",
    municipalities: [
      { name: "San Andrés", neighborhoods: ["Centro", "North End", "San Luis", "La Loma", "Sarie Bay", "Sound Bay"] },
      { name: "Providencia", neighborhoods: ["Santa Catalina", "Bottom House", "Southwest Bay"] }
    ]
  },
  {
    department: "Amazonas",
    municipalities: [
      { name: "Leticia", neighborhoods: ["Centro", "Nazareth", "Santa Sofía", "El Progreso", "La Playa"] }
    ]
  },
  {
    department: "Guainía",
    municipalities: [
      { name: "Inírida", neighborhoods: ["Centro", "El Paujil", "San Felipe", "Villa Concordia"] }
    ]
  },
  {
    department: "Guaviare",
    municipalities: [
      { name: "San José del Guaviare", neighborhoods: ["Centro", "El Progreso", "La Libertad", "Villa Nueva"] }
    ]
  },
  {
    department: "Vaupés",
    municipalities: [
      { name: "Mitú", neighborhoods: ["Centro", "El Encanto", "La Libertad"] }
    ]
  },
  {
    department: "Vichada",
    municipalities: [
      { name: "Puerto Carreño", neighborhoods: ["Centro", "La Libertad", "El Porvenir", "San José"] }
    ]
  }
];

// Helper functions to get departments, municipalities, and neighborhoods
export const getDepartments = (): string[] => {
  return colombiaLocations.map(loc => loc.department).sort();
};

export const getMunicipalitiesByDepartment = (department: string): string[] => {
  const location = colombiaLocations.find(loc => 
    loc.department.toLowerCase() === department.toLowerCase()
  );
  return location ? location.municipalities.map(m => m.name).sort() : [];
};

export const getNeighborhoodsByMunicipality = (department: string, municipality: string): string[] => {
  const location = colombiaLocations.find(loc => 
    loc.department.toLowerCase() === department.toLowerCase()
  );
  if (!location) return [];
  
  const muni = location.municipalities.find(m => 
    m.name.toLowerCase() === municipality.toLowerCase()
  );
  return muni ? muni.neighborhoods.sort() : [];
};
