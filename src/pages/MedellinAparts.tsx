import LandingCityType from "./LandingCityType";

export default function MedellinAparts(){
  return (
    <LandingCityType
      citySlug="medellin"
      cityName="Medellín"
      typeSlug="apartamentos"
      typeName="Apartamentos"
      barrios={["El Poblado","Laureles","Belén","Estadio","Buenos Aires"]}
    />
  );
}
