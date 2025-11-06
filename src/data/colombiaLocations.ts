export interface Location {
  department: string;
  municipalities: {
    name: string;
    neighborhoods: string[];
  }[];
}

export const colombiaLocations: Location[] = [
  {
    department: "Antioquia",
    municipalities: [
      {
        name: "Medellín",
        neighborhoods: ["El Poblado", "Laureles", "Envigado Centro", "Belén", "Buenos Aires", "La Candelaria", "Robledo", "Estadio", "Aranjuez", "La América", "Manrique", "Santa Cruz", "Castilla", "Villa Hermosa", "Guayabal", "San Javier", "Popular", "Santo Domingo Savio", "Doce de Octubre", "San Antonio de Prado", "Santa Elena", "Altavista", "Córdoba", "San Cristóbal", "Campo Valdés", "Prado Centro", "Jesús Nazareno", "El Chagualo"]
      },
      {
        name: "Envigado",
        neighborhoods: ["Envigado Centro", "La Paz", "Alcalá", "Otra Parte", "Zuniga", "Loma del Escobero", "Mesa", "La Magnolia", "Las Antillas", "Jardines", "San Marcos", "Señorial", "Sebastián de Belalcázar"]
      },
      {
        name: "Sabaneta",
        neighborhoods: ["Centro", "Cañaveralejo", "San José", "Las Casitas", "Holanda", "María Auxiliadora", "San Joaquín", "Promesa de Dios", "Entreamigos", "La Florida"]
      },
      {
        name: "La Estrella",
        neighborhoods: ["Centro", "La Tablaza", "Pueblo Viejo", "San José", "Ancón", "La Inmaculada", "La Ferrería", "Aranjuez"]
      },
      {
        name: "Itagüí",
        neighborhoods: ["Centro", "San Pío", "Santa María", "Ditaires", "Suramérica", "Olivares", "Fátima", "Tablaza", "Calatrava", "Simón Bolívar", "Los Gómez", "Rosalía", "Santa Rita"]
      },
      {
        name: "Bello",
        neighborhoods: ["Niquía", "Fontidueño", "La Madera", "Cabañas", "Suárez", "París", "Guadalupe", "Acevedo", "Niquia", "Santa Ana", "La Cumbre", "Bellavista", "Manchester", "Pachelly"]
      },
      {
        name: "Rionegro",
        neighborhoods: ["Centro", "Llanogrande", "San Antonio de Pereira", "La Convención", "Barro Blanco", "Porvenir", "El Tablazo", "El Carmelo", "Capiro", "Santa Bárbara", "San Nicolás", "La Mosca"]
      },
      {
        name: "Caldas",
        neighborhoods: ["Centro", "La Chinca", "La Quiebra", "La Salada", "La Valeria", "La Miel", "La Clara", "Pueblo Viejo", "El Raizal"]
      },
      {
        name: "Copacabana",
        neighborhoods: ["Centro", "La Paz", "Niquia", "La Veta", "Calle del Banco", "La Loma", "La Mota", "Restrepo Naranjo", "La Manguala"]
      },
      {
        name: "Marinilla",
        neighborhoods: ["Centro", "Santa Elena", "La Mesa", "San Lorenzo", "El Peñol", "La Cimarronas", "El Salado"]
      },
      {
        name: "Apartadó",
        neighborhoods: ["Centro", "El Reposo", "Popular", "Pablo VI", "La Chinita", "Nueva Esperanza", "Villa Estadio"]
      },
      {
        name: "Turbo",
        neighborhoods: ["Centro", "El Poblado", "Veranillo", "Los Córdobas", "Pueblo Nuevo", "La Lucila"]
      },
      {
        name: "Carmen de Viboral",
        neighborhoods: ["Centro", "La Chapa", "El Totumo", "La Milagrosa", "El Poblado"]
      },
      {
        name: "La Ceja",
        neighborhoods: ["Centro", "San Luis", "La Inmaculada", "El Capiro", "El Alto de Las Flores"]
      },
      {
        name: "Caucasia",
        neighborhoods: ["Centro", "Bolívar", "Cristo Rey", "La Paz", "Villa Nueva", "El Jardín"]
      },
      {
        name: "Santa Rosa de Osos",
        neighborhoods: ["Centro", "La Candelaria", "San Isidro", "Buenos Aires", "El Roble"]
      },
      {
        name: "Guarne",
        neighborhoods: ["Centro", "San José", "Chaparral", "La Mosca", "El Tambo"]
      },
      {
        name: "San Pedro de los Milagros",
        neighborhoods: ["Centro", "La Cumbre", "San Antonio", "Alto de Sabanas"]
      },
      {
        name: "Yarumal",
        neighborhoods: ["Centro", "Buenos Aires", "La Linda", "El Cedro", "Santa Rita"]
      },
      {
        name: "Andes",
        neighborhoods: ["Centro", "San Bartolomé", "Santa Rita", "La Chaparrala"]
      }
    ]
  },
  {
    department: "Cundinamarca",
    municipalities: [
      {
        name: "Bogotá",
        neighborhoods: ["Chapinero", "Usaquén", "Suba", "Engativá", "Fontibón", "Kennedy", "Teusaquillo", "Candelaria", "Santa Fe", "San Cristóbal", "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz", "Puente Aranda", "Los Mártires", "Antonio Nariño", "Bosa", "Tunjuelito", "Barrios Unidos", "Chicó", "Rosales", "Cedritos", "Modelia", "Hayuelos", "Tintal", "Portal de las Américas", "Patio Bonito", "Corabastos", "El Tunal", "Restrepo", "El Quiroga", "San Benito", "La Perseverancia", "Las Aguas", "La Macarena", "El Centro Internacional", "Santa Bárbara", "Normandía", "El Contador", "Los Alcázares", "Niza", "Colina Campestre", "San Antonio Norte", "Rincón del Chicó"]
      },
      {
        name: "Soacha",
        neighborhoods: ["Centro", "Compartir", "Ciudadela Sucre", "San Mateo", "León XIII", "Altos de la Florida", "Ciudad Verde", "San Humberto", "Ducales", "Villa Esperanza", "Terreros", "El Oasis"]
      },
      {
        name: "Chía",
        neighborhoods: ["Centro", "Bojacá", "Fonquetá", "Cerca de Piedra", "La Balsa", "Fagua", "Yerbabuena", "Santa Lucía", "Tíquiza", "San José"]
      },
      {
        name: "Zipaquirá",
        neighborhoods: ["Centro", "Barandillas", "San Carlos", "Portones", "Julio Caro", "San Juanito", "San Miguel", "La Paz", "Julio Flórez", "El Eucalipto"]
      },
      {
        name: "Facatativá",
        neighborhoods: ["Centro", "El Jardín", "Santa Marta", "Pueblo Viejo", "La Esmeralda", "El Corzo", "Manablanca", "La Moya", "Santa Bárbara"]
      },
      {
        name: "Cajicá",
        neighborhoods: ["Centro", "Calahorra", "Chuntame", "Río Grande", "La Palma", "El Misterio", "Capellanía"]
      },
      {
        name: "Madrid",
        neighborhoods: ["Centro", "San Fernando", "La Caro", "Sector Industrial", "Santa María del Río", "El Porvenir"]
      },
      {
        name: "Funza",
        neighborhoods: ["Centro", "Casablanca", "La Feria", "Serrezuela", "Prados de Funza", "El Hato"]
      },
      {
        name: "Mosquera",
        neighborhoods: ["Centro", "San Nicolás", "La Florida", "Serrezuela", "Santa María", "Ciudad Sabana"]
      },
      {
        name: "Fusagasugá",
        neighborhoods: ["Centro", "El Caney", "La Marichuela", "Pasquilla", "Obrero", "Luxemburgo", "Pablo VI", "El Resguardo", "Santa María"]
      },
      {
        name: "Girardot",
        neighborhoods: ["Centro", "Kennedy", "Villa Gladys", "Pueblo Nuevo", "La Esmeralda", "Barzalosa"]
      },
      {
        name: "Sopó",
        neighborhoods: ["Centro", "San Gabriel", "Aposentos", "Hato Grande", "La Diana"]
      },
      {
        name: "La Calera",
        neighborhoods: ["Centro", "El Salitre", "Mundo Nuevo", "La Ramada"]
      },
      {
        name: "Tocancipá",
        neighborhoods: ["Centro", "Verganzo", "Canavita", "Tibitó", "La Fuente"]
      },
      {
        name: "Tabio",
        neighborhoods: ["Centro", "Punta Larga", "Carrón", "Llano Grande"]
      },
      {
        name: "Tenjo",
        neighborhoods: ["Centro", "Chince", "El Estanco", "Poveda"]
      },
      {
        name: "Gachancipá",
        neighborhoods: ["Centro", "Santa Bárbara", "Palo Verde", "Pueblo Viejo"]
      },
      {
        name: "Cota",
        neighborhoods: ["Centro", "Parcelas", "La Moya", "Siberia", "Vuelta Grande"]
      },
      {
        name: "Ubaté",
        neighborhoods: ["Centro", "San Cayetano", "Santa Bárbara", "Poveda"]
      },
      {
        name: "Villeta",
        neighborhoods: ["Centro", "El Carmen", "La Esmeralda", "La Trinidad"]
      }
    ]
  },
  {
    department: "Valle del Cauca",
    municipalities: [
      {
        name: "Cali",
        neighborhoods: ["San Fernando", "El Peñón", "Granada", "Ciudad Jardín", "Normandía", "Limonar", "Santa Mónica", "El Ingenio", "Menga", "Tequendama", "Santa Anita", "Versalles", "San Antonio", "Santa Rita", "Flora Industrial", "Alfonso López", "Aguablanca", "Juanchito", "Alameda", "Salomia", "La Merced", "El Lido", "Centenario", "Chipichape", "Pance", "La Hacienda", "Unicentro", "El Refugio", "La Flora", "Tejares", "Llano Verde", "Potrero Grande", "Marroquín"]
      },
      {
        name: "Palmira",
        neighborhoods: ["Centro", "El Sembrador", "La Emilia", "Zamorano", "La Carbonera", "El Nogal", "El Placer", "Bolivariano", "La Torre", "Belalcázar"]
      },
      {
        name: "Buenaventura",
        neighborhoods: ["Centro", "Bellavista", "El Piñal", "Muro Yusti", "La Playita", "San Antonio", "Vientos Libres", "La Victoria", "Alfonso López", "San José"]
      },
      {
        name: "Yumbo",
        neighborhoods: ["Centro", "San Marcos", "Brisas de los Álamos", "El Cortijo", "Belalcázar", "Villa Luz", "Navegantes"]
      },
      {
        name: "Jamundí",
        neighborhoods: ["Centro", "Bocas del Palo", "Villa Paz", "Timba", "Piedra de Moler", "La Liberia"]
      },
      {
        name: "Tuluá",
        neighborhoods: ["Centro", "Santa Elena", "San Rafael", "La María", "Matamoros", "Alvernia", "San Carlos", "Barrancas", "El Jardín"]
      },
      {
        name: "Cartago",
        neighborhoods: ["Centro", "Santa Cecilia", "Alfonso López", "Los Ángeles", "Matadero", "Santa Rosa"]
      },
      {
        name: "Buga",
        neighborhoods: ["Centro", "San Gerardo", "La Libertad", "Nuevo Milenio", "Chapinero"]
      },
      {
        name: "Candelaria",
        neighborhoods: ["Centro", "Juanchito", "La Arroyohondo", "El Naranjo"]
      },
      {
        name: "Florida",
        neighborhoods: ["Centro", "La Paila", "Nueva Florida", "La Herradura"]
      },
      {
        name: "Pradera",
        neighborhoods: ["Centro", "Villa María", "Bolívar", "Vallegrande"]
      },
      {
        name: "Dagua",
        neighborhoods: ["Centro", "El Queremal", "Atuncela", "San Vicente"]
      }
    ]
  },
  {
    department: "Atlántico",
    municipalities: [
      {
        name: "Barranquilla",
        neighborhoods: ["El Prado", "Riomar", "Boston", "El Country", "Villa Santos", "El Poblado", "Alto Prado", "La Concepción", "Bellavista", "Las Flores", "Ciudad Jardín", "El Golf", "Los Nogales", "Altos del Limón", "Paraíso", "Villa Carolina", "Los Andes", "El Recreo", "San Vicente", "Simón Bolívar", "La Paz", "El Bosque", "La Victoria", "Rebolo", "Barlovento", "Bellas Artes", "Olaya", "Montecristo", "Las Malvinas", "San Roque", "Centro", "El Castillo", "La Cumbre"]
      },
      {
        name: "Soledad",
        neighborhoods: ["Centro", "La Central", "El Ferrocarril", "Ciudadela 20 de Julio", "Villa Estadio", "Mequejo", "La Arboleda", "Juan XXIII", "Villa Katanga", "El Bosque", "Metropolitano"]
      },
      {
        name: "Malambo",
        neighborhoods: ["Centro", "Pueblo Nuevo", "La Playa", "Aguada", "Villa Marbella", "Los Almendros"]
      },
      {
        name: "Puerto Colombia",
        neighborhoods: ["Centro", "Salgar", "Pradomar", "Sabanilla", "Miramar", "Villa Campestre"]
      },
      {
        name: "Galapa",
        neighborhoods: ["Centro", "Villa Rosa", "San Antonio", "Nueva Galapa", "La Pradera", "El Progreso"]
      },
      {
        name: "Sabanalarga",
        neighborhoods: ["Centro", "El Progreso", "7 de Agosto", "Prado", "San Roque"]
      },
      {
        name: "Baranoa",
        neighborhoods: ["Centro", "La Victoria", "El Carmen", "San Antonio"]
      },
      {
        name: "Sabanagrande",
        neighborhoods: ["Centro", "El Porvenir", "Villa del Rosario", "El Prado"]
      },
      {
        name: "Santo Tomás",
        neighborhoods: ["Centro", "El Porvenir", "El Carmen", "Villanueva"]
      },
      {
        name: "Polonuevo",
        neighborhoods: ["Centro", "La Esperanza", "Villa María", "El Progreso"]
      }
    ]
  },
  {
    department: "Santander",
    municipalities: [
      {
        name: "Bucaramanga",
        neighborhoods: ["Cabecera del Llano", "El Prado", "Álamos", "San Francisco", "Centro", "La Aurora", "Provenza", "Lagos del Cacique", "Sotomayor", "Morrorico", "García Rovira", "La Cumbre", "Real de Minas", "La Floresta", "Terrazas", "Los Cedros", "Cañaveral", "La Juventud", "Toledo Plata", "Campo Hermoso", "Antonia Santos", "El Bosque", "La Victoria", "San Martín", "Alfonso López"]
      },
      {
        name: "Floridablanca",
        neighborhoods: ["Centro", "Cañaveral", "Lagos I", "Altos de Bellavista", "Villabel", "Ruitoque", "El Bosque", "San Expedito", "Conucos", "La Cumbre", "Ciudadela Real de Minas"]
      },
      {
        name: "Piedecuesta",
        neighborhoods: ["Centro", "El Recreo", "Guatiguará", "La Esperanza", "Alto de Pamplona", "Alfonso López", "El Bueno", "Los Cauchos", "Santa Teresa", "Villa Rosario"]
      },
      {
        name: "Girón",
        neighborhoods: ["Centro", "La Esmeralda", "Kennedy", "Llano de Palmas", "Rincón", "El Poblado", "Villa Blanca", "Versalles", "El Rhin"]
      },
      {
        name: "San Gil",
        neighborhoods: ["Centro", "Cabecera", "Calle Real", "Pueblo Nuevo", "El Poblado", "La Granja"]
      },
      {
        name: "Barrancabermeja",
        neighborhoods: ["Centro", "La Victoria", "El Campín", "La Paz", "Boston", "El Cincuentenario", "Pueblo Nuevo", "Kennedy", "Primero de Mayo", "Miraflores"]
      },
      {
        name: "Socorro",
        neighborhoods: ["Centro", "El Poblado", "Santa Bárbara", "San Roque"]
      },
      {
        name: "Málaga",
        neighborhoods: ["Centro", "El Concilio", "La Vega", "San Cristóbal"]
      },
      {
        name: "Barbosa",
        neighborhoods: ["Centro", "Los Cauchos", "El Jardín", "Villa Nueva"]
      },
      {
        name: "Zapatoca",
        neighborhoods: ["Centro", "El Carmen", "San Antonio", "La Aurora"]
      }
    ]
  },
  {
    department: "Bolívar",
    municipalities: [
      {
        name: "Cartagena",
        neighborhoods: ["Bocagrande", "Castillogrande", "El Laguito", "Manga", "Getsemaní", "Centro Histórico", "Crespo", "Pie de la Popa", "El Cabrero", "Pie del Cerro", "Chambacú", "Torices", "Escallon Villa", "España", "La Matuna", "San Diego", "Marbella", "Manga", "El Bosque", "Villa Estrella", "Boston", "El Pozón", "Olaya Herrera", "Nelson Mandela", "Bayunca", "Pasacaballos"]
      },
      {
        name: "Turbaco",
        neighborhoods: ["Centro", "Ararca", "Gambote", "Varadero", "Membrillal", "Ballestas", "Villa Hermosa", "La Granja"]
      },
      {
        name: "Magangué",
        neighborhoods: ["Centro", "Pueblo Nuevo", "Santa Ana", "Las Mercedes", "El Contento", "La Esperanza"]
      },
      {
        name: "El Carmen de Bolívar",
        neighborhoods: ["Centro", "La Peña", "San Isidro", "Caracolí", "El Carmelo", "La Esperanza"]
      },
      {
        name: "Arjona",
        neighborhoods: ["Centro", "La Libertad", "El Retiro", "Villa Fátima"]
      },
      {
        name: "Santa Rosa del Sur",
        neighborhoods: ["Centro", "El Prado", "La Esperanza", "Popular"]
      },
      {
        name: "Mompox",
        neighborhoods: ["Centro Histórico", "Santa Bárbara", "San Carlos", "San Juan de Dios"]
      },
      {
        name: "Simití",
        neighborhoods: ["Centro", "La Paz", "El Progreso", "La Unión"]
      }
    ]
  },
  {
    department: "Risaralda",
    municipalities: [
      {
        name: "Pereira",
        neighborhoods: ["Centro", "Álamos", "Cuba", "La Circunvalar", "Olímpica", "Pío XII", "El Poblado", "Pinares de San Martín", "Boston", "Centenario", "Villa Santana", "Ferrocarril", "San Nicolás", "El Jardín", "Ciudadela Tokio", "Kennedy", "El Danubio", "Mejía Robledo", "La Victoria", "El Rocío", "Villavicencio", "San Fernando", "Málaga", "El Plumón"]
      },
      {
        name: "Dosquebradas",
        neighborhoods: ["Centro", "Frailes", "Palma de Oro", "Santa Teresita", "La Esneda", "El Japón", "Betania", "Los Álamos", "La Popa", "Villa Luz", "Bosques de la Acuarela"]
      },
      {
        name: "La Virginia",
        neighborhoods: ["Centro", "Bombay", "Villa Pilar", "Samaria", "El Bosque", "La Platanera"]
      },
      {
        name: "Santa Rosa de Cabal",
        neighborhoods: ["Centro", "La Capilla", "El Español", "Termales", "La Unión", "La Montaña", "Brisas de Santa Rosa"]
      },
      {
        name: "Marsella",
        neighborhoods: ["Centro", "El Trapiche", "San Isidro", "La Molina"]
      },
      {
        name: "Belén de Umbría",
        neighborhoods: ["Centro", "El Bosque", "La Selva", "Villa Nueva"]
      }
    ]
  },
  {
    department: "Quindío",
    municipalities: [
      {
        name: "Armenia",
        neighborhoods: ["Centro", "La Fachada", "Zuldemayda", "Quimbaya", "Los Naranjos", "Bosques de Pinares", "La Castellana", "Alfonso López", "Las Colinas", "Portal del Edén", "Ciudadela del Café", "La Secreta", "La Avanzada", "Uribe", "La Esperanza", "Villa del Prado", "Patio Bonito"]
      },
      {
        name: "Calarcá",
        neighborhoods: ["Centro", "La Bella", "Villa Ligia", "San José", "El Caimo", "Samaria", "El Danubio", "Dosquebradas"]
      },
      {
        name: "Montenegro",
        neighborhoods: ["Centro", "Pueblo Tapao", "El Vergel", "La Esmeralda", "Villa Natalia", "Santa Isabel"]
      },
      {
        name: "Circasia",
        neighborhoods: ["Centro", "La Virginia", "Buenavista", "Berlín", "Villa Ligia"]
      },
      {
        name: "La Tebaida",
        neighborhoods: ["Centro", "Chaparral", "Santa Eduviges", "Florida", "Villa del Prado"]
      },
      {
        name: "Quimbaya",
        neighborhoods: ["Centro", "Cruces", "Puerto Alejandría", "La Esmeralda", "El Caimo"]
      },
      {
        name: "Filandia",
        neighborhoods: ["Centro", "La Estrella", "Cruces", "Barranquilla"]
      },
      {
        name: "Salento",
        neighborhoods: ["Centro", "Boquía", "Palestina", "El Rincón"]
      },
      {
        name: "Córdoba",
        neighborhoods: ["Centro", "Alto Bonito", "Buenos Aires", "El Cedro"]
      },
      {
        name: "Pijao",
        neighborhoods: ["Centro", "Baraya", "El Triunfo", "La Florida"]
      }
    ]
  },
  {
    department: "Caldas",
    municipalities: [
      {
        name: "Manizales",
        neighborhoods: ["Centro", "Chipre", "Cable", "La Enea", "Palermo", "Versalles", "Campestre", "Palogrande", "Milán", "Ciudadela del Norte", "La Carola", "La Fuente"]
      },
      {
        name: "Villamaría",
        neighborhoods: ["Centro", "El Rosario", "Bajo Tablazo", "Maltería", "Gallinazo"]
      },
      {
        name: "Chinchiná",
        neighborhoods: ["Centro", "San José", "Guayabal", "Bomboná", "San Francisco"]
      },
      {
        name: "La Dorada",
        neighborhoods: ["Centro", "Caracolí", "La Granja", "Santander", "San Fernando"]
      }
    ]
  },
  {
    department: "Boyacá",
    municipalities: [
      {
        name: "Tunja",
        neighborhoods: ["Centro", "San Lázaro", "Mesopotamia", "El Recreo", "Muiscas", "Santa Inés", "Asís", "Rincón de la Candelaria"]
      },
      {
        name: "Duitama",
        neighborhoods: ["Centro", "El Cedro", "La Pradera", "Bonanza", "Kennedy", "San Luis"]
      },
      {
        name: "Sogamoso",
        neighborhoods: ["Centro", "Mochacá", "Monquirá", "Venecia", "Santa Ana", "Enrique Olaya Herrera"]
      },
      {
        name: "Chiquinquirá",
        neighborhoods: ["Centro", "Progreso", "Santa Bárbara", "Rosario"]
      },
      {
        name: "Paipa",
        neighborhoods: ["Centro", "Palermo", "El Salitre", "Vargas"]
      },
      {
        name: "Villa de Leyva",
        neighborhoods: ["Centro", "Carmen", "La Punta", "Pueblo Viejo"]
      }
    ]
  },
  {
    department: "Norte de Santander",
    municipalities: [
      {
        name: "Cúcuta",
        neighborhoods: ["Centro", "Caobos", "Lleras", "Latino", "Quinta Bosch", "La Playa", "Toledo Plata", "Atalaya", "Colpet", "Aniversario", "San Luis", "Virgilio Barco"]
      },
      {
        name: "Ocaña",
        neighborhoods: ["Centro", "Tarra", "Carmen", "Olaya Herrera", "Popular"]
      },
      {
        name: "Pamplona",
        neighborhoods: ["Centro", "La Esperanza", "La Humildad", "Santa Bárbara"]
      },
      {
        name: "Villa del Rosario",
        neighborhoods: ["Centro", "Los Libertadores", "La Gazapa", "Callejón"]
      }
    ]
  },
  {
    department: "Tolima",
    municipalities: [
      {
        name: "Ibagué",
        neighborhoods: ["Centro", "Jordán", "Ambalá", "Salado", "La Pola", "El Topacio", "Picaleña", "Terranova", "San Simón", "Cádiz", "Gaitan", "Villa Restrepo"]
      },
      {
        name: "Espinal",
        neighborhoods: ["Centro", "Gaitán", "La Esperanza", "Norte", "El Carmen"]
      },
      {
        name: "Melgar",
        neighborhoods: ["Centro", "Villa Rica", "La Vega", "Mariquita"]
      },
      {
        name: "Honda",
        neighborhoods: ["Centro", "Quebradanegra", "San Bartolo", "Avenida del Río"]
      }
    ]
  },
  {
    department: "Huila",
    municipalities: [
      {
        name: "Neiva",
        neighborhoods: ["Centro", "La Gaitana", "El Caguán", "Altico", "Granjas", "Calixto Leiva", "Siete de Agosto", "Las Palmas", "Álamos", "San Luis", "La Floresta"]
      },
      {
        name: "Pitalito",
        neighborhoods: ["Centro", "Palermo", "San Jorge", "El Libertador", "La Esperanza"]
      },
      {
        name: "Garzón",
        neighborhoods: ["Centro", "La Magdalena", "San Fernando", "El Batán"]
      },
      {
        name: "La Plata",
        neighborhoods: ["Centro", "Belén", "La Florida", "San Mateo"]
      }
    ]
  },
  {
    department: "Magdalena",
    municipalities: [
      {
        name: "Santa Marta",
        neighborhoods: ["Centro", "El Rodadero", "Mamatoco", "Gaira", "Bello Horizonte", "Pozos Colorados", "Bastidas", "Taganga", "Bureche", "Minca"]
      },
      {
        name: "Ciénaga",
        neighborhoods: ["Centro", "San Pedro", "Cordobita", "Las Flores"]
      },
      {
        name: "Fundación",
        neighborhoods: ["Centro", "Santa Ana", "El Carmen", "Sevilla"]
      }
    ]
  },
  {
    department: "Cesar",
    municipalities: [
      {
        name: "Valledupar",
        neighborhoods: ["Centro", "El Prado", "La Nevada", "Sicarare", "Alfonso López", "Los Carraos", "Villa Margarita", "Fundación Pro-Vivienda", "José Antonio Galán", "Novalito"]
      },
      {
        name: "Aguachica",
        neighborhoods: ["Centro", "Popular", "Minas", "San Roque"]
      },
      {
        name: "Bosconia",
        neighborhoods: ["Centro", "Villa Mercedes", "Gramalote", "Rincón Hondo"]
      }
    ]
  },
  {
    department: "Córdoba",
    municipalities: [
      {
        name: "Montería",
        neighborhoods: ["Centro", "El Bongo", "Cantaclaro", "La Granja", "Mogambo", "Urbanización El Poblado", "Castellana", "Pastrana Borrero", "El Dorado", "Alfonso López", "Furatena"]
      },
      {
        name: "Cereté",
        neighborhoods: ["Centro", "Villa Ana", "Los Coquitos", "Villa Susana"]
      },
      {
        name: "Lorica",
        neighborhoods: ["Centro", "Villa Cielo", "Primero de Mayo", "Pasacorriendo"]
      },
      {
        name: "Sahagún",
        neighborhoods: ["Centro", "Loma Arena", "La Unión", "Villa Fátima"]
      }
    ]
  },
  {
    department: "Sucre",
    municipalities: [
      {
        name: "Sincelejo",
        neighborhoods: ["Centro", "La Gallera", "Majagual", "Villa Margarita", "Las Peñitas", "La Arena", "Repelon", "Berlín", "Colina Real", "Buenavista"]
      },
      {
        name: "Corozal",
        neighborhoods: ["Centro", "San José", "Las Mercedes", "Santa Teresa"]
      },
      {
        name: "San Marcos",
        neighborhoods: ["Centro", "San Pedro", "Bellavista", "La Victoria"]
      }
    ]
  },
  {
    department: "La Guajira",
    municipalities: [
      {
        name: "Riohacha",
        neighborhoods: ["Centro", "La Loma", "El Progreso", "Villa Fátima", "Marbella", "Centro Histórico", "El Dividivi"]
      },
      {
        name: "Maicao",
        neighborhoods: ["Centro", "Marbella", "La Paz", "Los Andes", "Villa Julieth"]
      },
      {
        name: "Uribia",
        neighborhoods: ["Centro", "Villa Martín", "Carraipía"]
      },
      {
        name: "Fonseca",
        neighborhoods: ["Centro", "Oreganal", "Conejo", "Sitio Nuevo"]
      }
    ]
  },
  {
    department: "Nariño",
    municipalities: [
      {
        name: "Pasto",
        neighborhoods: ["Centro", "Pandiaco", "Las Américas", "Torobajo", "El Progreso", "Santa Mónica", "La Esperanza", "Agualongo", "Tamasagra", "San Vicente", "La Rosa"]
      },
      {
        name: "Tumaco",
        neighborhoods: ["Centro", "Viento Libre", "La Florida", "Nuevo Milenio", "Ciudadela"]
      },
      {
        name: "Ipiales",
        neighborhoods: ["Centro", "Santander", "La Victoria", "Las Cruces", "San Felipe"]
      },
      {
        name: "Túquerres",
        neighborhoods: ["Centro", "La Laguna", "Barbacoas", "Cumbal"]
      }
    ]
  },
  {
    department: "Cauca",
    municipalities: [
      {
        name: "Popayán",
        neighborhoods: ["Centro", "Alfonso López", "El Empedrado", "La Paz", "El Recuerdo", "Loma de la Virgen", "Santa Mónica", "La Esmeralda", "Pandiguando", "Caldono", "Bolívar"]
      },
      {
        name: "Santander de Quilichao",
        neighborhoods: ["Centro", "La Capilla", "Santa María", "Villa Nueva"]
      },
      {
        name: "Puerto Tejada",
        neighborhoods: ["Centro", "Las Américas", "Villa del Sur", "El Placer"]
      }
    ]
  },
  {
    department: "Meta",
    municipalities: [
      {
        name: "Villavicencio",
        neighborhoods: ["Centro", "Barzal", "Catumare", "Popular", "Morichal", "Altos de San Jorge", "Hacaritama", "Recreo", "Santo Domingo", "Villa Juliana", "Maizaro", "La Esperanza"]
      },
      {
        name: "Acacías",
        neighborhoods: ["Centro", "Villa Mercedes", "Villa Olímpica", "La Unión"]
      },
      {
        name: "Granada",
        neighborhoods: ["Centro", "La Isla", "Brisas del Llano", "San José"]
      },
      {
        name: "San Martín",
        neighborhoods: ["Centro", "El Porvenir", "San Carlos", "La Libertad"]
      }
    ]
  },
  {
    department: "Casanare",
    municipalities: [
      {
        name: "Yopal",
        neighborhoods: ["Centro", "La Granja", "El Paraíso", "Jorge Eliécer Gaitán", "Doña Luz", "Alcaraván", "San Rafael"]
      },
      {
        name: "Aguazul",
        neighborhoods: ["Centro", "Nueva Colombia", "Villa Nueva", "El Milagro"]
      },
      {
        name: "Villanueva",
        neighborhoods: ["Centro", "La Estación", "El Centro", "Puente Amarillo"]
      }
    ]
  },
  {
    department: "Arauca",
    municipalities: [
      {
        name: "Arauca",
        neighborhoods: ["Centro", "El Paraíso", "Lleras", "La Unión", "Simón Bolívar", "Libertadores"]
      },
      {
        name: "Tame",
        neighborhoods: ["Centro", "Santa Teresita", "La Esperanza", "San José"]
      },
      {
        name: "Saravena",
        neighborhoods: ["Centro", "Los Fundadores", "El Progreso", "Villa del Río"]
      }
    ]
  },
  {
    department: "Putumayo",
    municipalities: [
      {
        name: "Mocoa",
        neighborhoods: ["Centro", "El Progreso", "La Planada", "San Luis", "El Empalme"]
      },
      {
        name: "Puerto Asís",
        neighborhoods: ["Centro", "Villa del Río", "Ciudadela", "San Miguel"]
      },
      {
        name: "Orito",
        neighborhoods: ["Centro", "Villa Luz", "Bosques de Orito", "La Esperanza"]
      }
    ]
  },
  {
    department: "Caquetá",
    municipalities: [
      {
        name: "Florencia",
        neighborhoods: ["Centro", "El Torasso", "La Vega", "Las Américas", "Popular", "Altos de Florencia", "Miraflores"]
      },
      {
        name: "San Vicente del Caguán",
        neighborhoods: ["Centro", "La Unión", "El Progreso", "Villa Nueva"]
      },
      {
        name: "Puerto Rico",
        neighborhoods: ["Centro", "Santander", "La Paz", "El Carmen"]
      }
    ]
  },
  {
    department: "Chocó",
    municipalities: [
      {
        name: "Quibdó",
        neighborhoods: ["Centro", "Pandeyuca", "El Reposo", "Kennedy", "Roma", "La Yesca", "César Conto"]
      },
      {
        name: "Istmina",
        neighborhoods: ["Centro", "San José", "Santa Rita", "Bellavista"]
      },
      {
        name: "Condoto",
        neighborhoods: ["Centro", "La Victoria", "Marmolejo", "Opogodó"]
      }
    ]
  },
  {
    department: "Guaviare",
    municipalities: [
      {
        name: "San José del Guaviare",
        neighborhoods: ["Centro", "Primavera", "La Esperanza", "Villa Nueva", "Las Américas"]
      },
      {
        name: "Calamar",
        neighborhoods: ["Centro", "Villa Hermosa", "San Luis"]
      }
    ]
  },
  {
    department: "Vichada",
    municipalities: [
      {
        name: "Puerto Carreño",
        neighborhoods: ["Centro", "La Primavera", "Villa Nueva", "El Porvenir"]
      }
    ]
  },
  {
    department: "Amazonas",
    municipalities: [
      {
        name: "Leticia",
        neighborhoods: ["Centro", "San Juan Bosco", "Las Mercedes", "Los Fundadores", "Nazareth"]
      },
      {
        name: "Puerto Nariño",
        neighborhoods: ["Centro", "La Libertad", "San Francisco"]
      }
    ]
  },
  {
    department: "San Andrés y Providencia",
    municipalities: [
      {
        name: "San Andrés",
        neighborhoods: ["Centro", "North End", "La Loma", "San Luis", "Sound Bay"]
      },
      {
        name: "Providencia",
        neighborhoods: ["Centro", "Bottom House", "Rocky Point", "South West Bay"]
      }
    ]
  },
  {
    department: "Guainía",
    municipalities: [
      {
        name: "Inírida",
        neighborhoods: ["Centro", "Popular", "Obrero", "Brisas del Río", "Villa Nueva"]
      }
    ]
  },
  {
    department: "Vaupés",
    municipalities: [
      {
        name: "Mitú",
        neighborhoods: ["Centro", "La Esperanza", "Centro Administrativo", "Zona Industrial"]
      }
    ]
  }
];

export const getDepartments = (): string[] => {
  return colombiaLocations.map(loc => loc.department);
};

export const getMunicipalitiesByDepartment = (department: string): string[] => {
  const location = colombiaLocations.find(loc => loc.department === department);
  return location ? location.municipalities.map(m => m.name) : [];
};

export const getNeighborhoodsByMunicipality = (department: string, municipality: string): string[] => {
  const location = colombiaLocations.find(loc => loc.department === department);
  if (!location) return [];
  
  const muni = location.municipalities.find(m => m.name === municipality);
  return muni ? muni.neighborhoods : [];
};
