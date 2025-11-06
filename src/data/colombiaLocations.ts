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
        neighborhoods: ["El Poblado", "Laureles", "Envigado Centro", "Belén", "Buenos Aires", "La Candelaria", "Robledo", "Estadio", "Aranjuez", "La América", "Manrique", "Santa Cruz", "Castilla", "Villa Hermosa", "Guayabal"]
      },
      {
        name: "Envigado",
        neighborhoods: ["Envigado Centro", "La Paz", "Alcalá", "Otra Parte", "Zuniga", "Loma del Escobero", "Mesa"]
      },
      {
        name: "Sabaneta",
        neighborhoods: ["Centro", "Cañaveralejo", "San José", "Las Casitas", "Holanda", "María Auxiliadora"]
      },
      {
        name: "La Estrella",
        neighborhoods: ["Centro", "La Tablaza", "Pueblo Viejo", "San José", "Ancón"]
      },
      {
        name: "Itagüí",
        neighborhoods: ["Centro", "San Pío", "Santa María", "Ditaires", "Suramérica", "Olivares", "Fátima", "Tablaza"]
      },
      {
        name: "Bello",
        neighborhoods: ["Niquía", "Fontidueño", "La Madera", "Cabañas", "Suárez", "París", "Guadalupe", "Acevedo"]
      },
      {
        name: "Rionegro",
        neighborhoods: ["Centro", "Llanogrande", "San Antonio de Pereira", "La Convención", "Barro Blanco", "Porvenir"]
      },
      {
        name: "Caldas",
        neighborhoods: ["Centro", "La Chinca", "La Quiebra", "La Salada", "La Valeria"]
      },
      {
        name: "Copacabana",
        neighborhoods: ["Centro", "La Paz", "Niquia", "La Veta", "Calle del Banco"]
      },
      {
        name: "Marinilla",
        neighborhoods: ["Centro", "Santa Elena", "La Mesa", "San Lorenzo"]
      }
    ]
  },
  {
    department: "Cundinamarca",
    municipalities: [
      {
        name: "Bogotá",
        neighborhoods: ["Chapinero", "Usaquén", "Suba", "Engativá", "Fontibón", "Kennedy", "Teusaquillo", "Candelaria", "Santa Fe", "San Cristóbal", "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz", "Puente Aranda", "Los Mártires", "Antonio Nariño", "Bosa", "Tunjuelito", "Barrios Unidos", "Chicó", "Rosales"]
      },
      {
        name: "Soacha",
        neighborhoods: ["Centro", "Compartir", "Ciudadela Sucre", "San Mateo", "León XIII", "Altos de la Florida", "Ciudad Verde"]
      },
      {
        name: "Chía",
        neighborhoods: ["Centro", "Bojacá", "Fonquetá", "Cerca de Piedra", "La Balsa", "Fagua"]
      },
      {
        name: "Zipaquirá",
        neighborhoods: ["Centro", "Barandillas", "San Carlos", "Portones", "Julio Caro", "San Juanito"]
      },
      {
        name: "Facatativá",
        neighborhoods: ["Centro", "El Jardín", "Santa Marta", "Pueblo Viejo", "La Esmeralda"]
      },
      {
        name: "Cajicá",
        neighborhoods: ["Centro", "Calahorra", "Chuntame", "Río Grande"]
      },
      {
        name: "Madrid",
        neighborhoods: ["Centro", "San Fernando", "La Caro", "Sector Industrial"]
      },
      {
        name: "Funza",
        neighborhoods: ["Centro", "Casablanca", "La Feria", "Serrezuela"]
      },
      {
        name: "Mosquera",
        neighborhoods: ["Centro", "San Nicolás", "La Florida", "Serrezuela"]
      },
      {
        name: "Fusagasugá",
        neighborhoods: ["Centro", "El Caney", "La Marichuela", "Pasquilla", "Obrero"]
      }
    ]
  },
  {
    department: "Valle del Cauca",
    municipalities: [
      {
        name: "Cali",
        neighborhoods: ["San Fernando", "El Peñón", "Granada", "Ciudad Jardín", "Normandía", "Limonar", "Santa Mónica", "El Ingenio", "Menga", "Tequendama", "Santa Anita", "Versalles", "San Antonio", "Santa Rita", "Flora Industrial", "Alfonso López", "Aguablanca"]
      },
      {
        name: "Palmira",
        neighborhoods: ["Centro", "El Sembrador", "La Emilia", "Zamorano", "La Carbonera", "El Nogal"]
      },
      {
        name: "Buenaventura",
        neighborhoods: ["Centro", "Bellavista", "El Piñal", "Muro Yusti", "La Playita", "San Antonio"]
      },
      {
        name: "Yumbo",
        neighborhoods: ["Centro", "San Marcos", "Brisas de los Álamos", "El Cortijo"]
      },
      {
        name: "Jamundí",
        neighborhoods: ["Centro", "Bocas del Palo", "Villa Paz", "Timba"]
      },
      {
        name: "Tuluá",
        neighborhoods: ["Centro", "Santa Elena", "San Rafael", "La María", "Matamoros"]
      }
    ]
  },
  {
    department: "Atlántico",
    municipalities: [
      {
        name: "Barranquilla",
        neighborhoods: ["El Prado", "Riomar", "Boston", "El Country", "Villa Santos", "El Poblado", "Alto Prado", "La Concepción", "Bellavista", "Las Flores", "Ciudad Jardín", "El Golf", "Los Nogales", "Altos del Limón", "Paraíso"]
      },
      {
        name: "Soledad",
        neighborhoods: ["Centro", "La Central", "El Ferrocarril", "Ciudadela 20 de Julio", "Villa Estadio", "Mequejo"]
      },
      {
        name: "Malambo",
        neighborhoods: ["Centro", "Pueblo Nuevo", "La Playa", "Aguada"]
      },
      {
        name: "Puerto Colombia",
        neighborhoods: ["Centro", "Salgar", "Pradomar", "Sabanilla"]
      },
      {
        name: "Galapa",
        neighborhoods: ["Centro", "Villa Rosa", "San Antonio", "Nueva Galapa"]
      }
    ]
  },
  {
    department: "Santander",
    municipalities: [
      {
        name: "Bucaramanga",
        neighborhoods: ["Cabecera del Llano", "El Prado", "Álamos", "San Francisco", "Centro", "La Aurora", "Provenza", "Lagos del Cacique", "Sotomayor", "Morrorico", "García Rovira", "La Cumbre", "Real de Minas"]
      },
      {
        name: "Floridablanca",
        neighborhoods: ["Centro", "Cañaveral", "Lagos I", "Altos de Bellavista", "Villabel", "Ruitoque"]
      },
      {
        name: "Piedecuesta",
        neighborhoods: ["Centro", "El Recreo", "Guatiguará", "La Esperanza", "Alto de Pamplona", "Alfonso López"]
      },
      {
        name: "Girón",
        neighborhoods: ["Centro", "La Esmeralda", "Kennedy", "Llano de Palmas", "Rincón"]
      },
      {
        name: "San Gil",
        neighborhoods: ["Centro", "Cabecera", "Calle Real", "Pueblo Nuevo"]
      },
      {
        name: "Barrancabermeja",
        neighborhoods: ["Centro", "La Victoria", "El Campín", "La Paz", "Boston"]
      }
    ]
  },
  {
    department: "Bolívar",
    municipalities: [
      {
        name: "Cartagena",
        neighborhoods: ["Bocagrande", "Castillogrande", "El Laguito", "Manga", "Getsemaní", "Centro Histórico", "Crespo", "Pie de la Popa", "El Cabrero", "Pie del Cerro", "Chambacú", "Torices", "Escallon Villa"]
      },
      {
        name: "Turbaco",
        neighborhoods: ["Centro", "Ararca", "Gambote", "Varadero", "Membrillal"]
      },
      {
        name: "Magangué",
        neighborhoods: ["Centro", "Pueblo Nuevo", "Santa Ana", "Las Mercedes"]
      },
      {
        name: "El Carmen de Bolívar",
        neighborhoods: ["Centro", "La Peña", "San Isidro", "Caracolí"]
      }
    ]
  },
  {
    department: "Risaralda",
    municipalities: [
      {
        name: "Pereira",
        neighborhoods: ["Centro", "Álamos", "Cuba", "La Circunvalar", "Olímpica", "Pío XII", "El Poblado", "Pinares de San Martín", "Boston", "Centenario", "Villa Santana", "Ferrocarril"]
      },
      {
        name: "Dosquebradas",
        neighborhoods: ["Centro", "Frailes", "Palma de Oro", "Santa Teresita", "La Esneda", "El Japón"]
      },
      {
        name: "La Virginia",
        neighborhoods: ["Centro", "Bombay", "Villa Pilar", "Samaria"]
      },
      {
        name: "Santa Rosa de Cabal",
        neighborhoods: ["Centro", "La Capilla", "El Español", "Termales"]
      }
    ]
  },
  {
    department: "Quindío",
    municipalities: [
      {
        name: "Armenia",
        neighborhoods: ["Centro", "La Fachada", "Zuldemayda", "Quimbaya", "Los Naranjos", "Bosques de Pinares", "La Castellana", "Alfonso López", "Las Colinas", "Portal del Edén"]
      },
      {
        name: "Calarcá",
        neighborhoods: ["Centro", "La Bella", "Villa Ligia", "San José", "El Caimo"]
      },
      {
        name: "Montenegro",
        neighborhoods: ["Centro", "Pueblo Tapao", "El Vergel", "La Esmeralda"]
      },
      {
        name: "Circasia",
        neighborhoods: ["Centro", "La Virginia", "Buenavista", "Berlín"]
      },
      {
        name: "La Tebaida",
        neighborhoods: ["Centro", "Chaparral", "Santa Eduviges", "Florida"]
      },
      {
        name: "Quimbaya",
        neighborhoods: ["Centro", "Cruces", "Puerto Alejandría", "La Esmeralda"]
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
