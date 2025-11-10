import LandingCityType from "./LandingCityType";

export default function ItaguiAparts(){
  return (
    <LandingCityType
      citySlug="itagui"
      cityName="Itagüí"
      typeSlug="apartamentos"
      typeName="Apartamentos"
      barrios={["Santa María","Ditaires","San Pío","Simón Bolívar"]}
    />
  );
}
