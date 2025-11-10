import { useEffect } from "react";
import { Link } from "react-router-dom";

type Props = {
  citySlug: string;
  cityName: string;
  typeSlug: string;
  typeName: string;
  barrios?: string[];
};

export default function LandingCityType({
  citySlug, cityName, typeSlug, typeName, barrios = [],
}: Props) {
  const canonical = `https://inmotivo.com/${citySlug}/arriendo/${typeSlug}`;

  useEffect(() => {
    document.title = `${typeName} en arriendo en ${cityName} | INMOTIVO`;
    const descTxt = `Encuentra ${typeName.toLowerCase()} en arriendo en ${cityName} cerca de tu ruta. Búsqueda con GPS en vivo, filtros por precio y barrios. INMOTIVO: rápido y sencillo.`;
    const metaDesc =
      (document.querySelector('meta[name="description"]') as HTMLMetaElement) ??
      document.head.appendChild(Object.assign(document.createElement("meta"), { name: "description" }));
    metaDesc.setAttribute("content", descTxt);
    const linkCanonical =
      (document.querySelector('link[rel="canonical"]') as HTMLLinkElement) ??
      document.head.appendChild(Object.assign(document.createElement("link"), { rel: "canonical" }));
    linkCanonical.setAttribute("href", canonical);
  }, [cityName, typeName, canonical]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold mb-3">
        {typeName} en arriendo en {cityName}
      </h1>
      <p className="text-muted-foreground mb-6">
        Explora el mapa con GPS en tiempo real. Ajusta el radio y recibe opciones cercanas a tu ruta.
      </p>
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          to={`/navegacion?query=${encodeURIComponent(typeSlug.slice(0,-1))}&autostart=true`}
          className="inline-flex items-center rounded-xl px-4 py-2 bg-green-600 text-white hover:bg-green-700"
        >
          Ver en mapa (navegación)
        </Link>
        <Link
          to={`/navegacion?query=${encodeURIComponent(typeSlug.slice(0,-1))}`}
          className="inline-flex items-center rounded-xl px-4 py-2 border border-green-600 text-green-700 hover:bg-green-50"
        >
          Buscar en mapa
        </Link>
      </div>
      {barrios.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Barrios populares</h2>
          <div className="flex flex-wrap gap-2">
            {barrios.map((b) => (
              <Link
                key={b}
                to={`/navegacion?query=${encodeURIComponent(`${typeSlug.slice(0,-1)} en ${b}`)}`}
                className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
              >
                {b}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
