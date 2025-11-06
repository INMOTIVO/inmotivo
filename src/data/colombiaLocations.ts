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
        neighborhoods: ["El Poblado", "Laureles", "Envigado Centro", "Belén", "Buenos Aires", "La Candelaria", "Robledo", "Estadio", "Aranjuez", "La América"]
      },
      {
        name: "Envigado",
        neighborhoods: ["Envigado Centro", "La Paz", "Alcalá", "Otra Parte", "Zuniga"]
      },
      {
        name: "Sabaneta",
        neighborhoods: ["Centro", "Cañaveralejo", "San José", "Las Casitas"]
      },
      {
        name: "La Estrella",
        neighborhoods: ["Centro", "La Tablaza", "Pueblo Viejo", "San José"]
      },
      {
        name: "Itagüí",
        neighborhoods: ["Centro", "San Pío", "Santa María", "Ditaires", "Suramérica"]
      },
      {
        name: "Bello",
        neighborhoods: ["Niquía", "Fontidueño", "La Madera", "Cabañas", "Suárez"]
      },
      {
        name: "Rionegro",
        neighborhoods: ["Centro", "Llanogrande", "San Antonio de Pereira", "La Convención"]
      }
    ]
  },
  {
    department: "Cundinamarca",
    municipalities: [
      {
        name: "Bogotá",
        neighborhoods: ["Chapinero", "Usaquén", "Suba", "Engativá", "Fontibón", "Kennedy", "Teusaquillo", "Candelaria", "Santa Fe", "San Cristóbal", "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz"]
      },
      {
        name: "Soacha",
        neighborhoods: ["Centro", "Compartir", "Ciudadela Sucre", "San Mateo", "León XIII"]
      },
      {
        name: "Chía",
        neighborhoods: ["Centro", "Bojacá", "Fonquetá", "Cerca de Piedra"]
      },
      {
        name: "Zipaquirá",
        neighborhoods: ["Centro", "Barandillas", "San Carlos", "Portones"]
      }
    ]
  },
  {
    department: "Valle del Cauca",
    municipalities: [
      {
        name: "Cali",
        neighborhoods: ["San Fernando", "El Peñón", "Granada", "Ciudad Jardín", "Normandía", "Limonar", "Santa Mónica", "El Ingenio", "Menga", "Tequendama"]
      },
      {
        name: "Palmira",
        neighborhoods: ["Centro", "El Sembrador", "La Emilia", "Zamorano"]
      },
      {
        name: "Buenaventura",
        neighborhoods: ["Centro", "Bellavista", "El Piñal", "Muro Yusti"]
      }
    ]
  },
  {
    department: "Atlántico",
    municipalities: [
      {
        name: "Barranquilla",
        neighborhoods: ["El Prado", "Riomar", "Boston", "El Country", "Villa Santos", "El Poblado", "Alto Prado", "La Concepción", "Bellavista", "Las Flores"]
      },
      {
        name: "Soledad",
        neighborhoods: ["Centro", "La Central", "El Ferrocarril", "Ciudadela 20 de Julio"]
      }
    ]
  },
  {
    department: "Santander",
    municipalities: [
      {
        name: "Bucaramanga",
        neighborhoods: ["Cabecera del Llano", "El Prado", "Álamos", "San Francisco", "Centro", "La Aurora", "Provenza", "Lagos del Cacique"]
      },
      {
        name: "Floridablanca",
        neighborhoods: ["Centro", "Cañaveral", "Lagos I", "Altos de Bellavista"]
      },
      {
        name: "Piedecuesta",
        neighborhoods: ["Centro", "El Recreo", "Guatiguará", "La Esperanza"]
      }
    ]
  },
  {
    department: "Bolívar",
    municipalities: [
      {
        name: "Cartagena",
        neighborhoods: ["Bocagrande", "Castillogrande", "El Laguito", "Manga", "Getsemaní", "Centro Histórico", "Crespo", "Pie de la Popa", "El Cabrero"]
      },
      {
        name: "Turbaco",
        neighborhoods: ["Centro", "Ararca", "Gambote"]
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
