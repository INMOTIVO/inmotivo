import LandingCityType from "./LandingCityType";

export default function EnvigadoAparts(){
  return (
    <LandingCityType
      citySlug="envigado"
      cityName="Envigado"
      typeSlug="apartamentos"
      typeName="Apartamentos"
      barrios={["Zúñiga","La Magnolia","El Dorado","La Sebastiana"]}
    />
  );
}
