import LandingCityType from "./LandingCityType";

export default function SabanetaCasas(){
  return (
    <LandingCityType
      citySlug="sabaneta"
      cityName="Sabaneta"
      typeSlug="casas"
      typeName="Casas"
      barrios={["Aves María","Aliadas del Sur","San Joaquín","Prados de Sabaneta"]}
    />
  );
}
