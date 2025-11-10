import LandingCityType from "./LandingCityType";

export default function BelloAparts(){
  return (
    <LandingCityType
      citySlug="bello"
      cityName="Bello"
      typeSlug="apartamentos"
      typeName="Apartamentos"
      barrios={["Santa Ana","Niquía","Cabañas","Bellavista"]}
    />
  );
}
