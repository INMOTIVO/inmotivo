import { useEffect } from "react";
import { Link } from "react-router-dom";

type Props = {
  citySlug: string;           // "medellin"
  cityName: string;           // "Medellín"
  typeSlug: string;           // "apartamentos" | "casas"
  typeName: string;           // "Apartamentos" | "Casas"
  barrios?: string[];         // chips sugeridos
  barrioSlug?: string;        // opcional: "laureles"
  barrioName?: string;        // opcional: "Laureles"
};

export default function LandingCityType({
  citySlug, cityName, typeSlug, typeName,
  barrios = [], barrioSlug, barrioName
}: Props) {
  const isBarrio = Boolean(barrioSlug && barrioName);
  const basePath = `/` + [citySlug, "arriendo", typeSlug].join("/");
  const pagePath = isBarrio ? `${basePath}/${barrioSlug}` : basePath;
  const canonical = `https://inmotivo.com${pagePath}`;
  const heading = isBarrio
    ? `${typeName} en arriendo en ${barrioName}, ${cityName}`
    : `${typeName} en arriendo en ${cityName}`;

  useEffect(() => {
    // Title + Description
    document.title = `${heading} | INMOTIVO`;
    const descTxt = isBarrio
      ? `Encuentra ${typeName.toLowerCase()} en arriendo en ${barrioName}, ${cityName}. Búsqueda con GPS en vivo, filtros por precio y barrios.`
      : `Encuentra ${typeName.toLowerCase()} en arriendo en ${cityName} cerca de tu ruta. Búsqueda con GPS en vivo, filtros por precio y barrios.`;
    const metaDesc =
      (document.querySelector('meta[name="description"]') as HTMLMetaElement) ??
      document.head.appendChild(Object.assign(document.createElement("meta"), { name: "description" }));
    metaDesc.setAttribute("content", descTxt);
    const linkCanonical =
      (document.querySelector('link[rel="canonical"]') as HTMLLinkElement) ??
      document.head.appendChild(Object.assign(document.createElement("link"), { rel: "canonical" }));
    linkCanonical.setAttribute("href", canonical);

    // BreadcrumbList JSON-LD cuando hay barrio
    const prev = document.getElementById("ld-breadcrumbs");
    if (prev) prev.remove();
    if (isBarrio) {
      const ld = document.createElement("script");
      ld.id = "ld-breadcrumbs";
      ld.type = "application/ld+json";
      ld.text = JSON.stringify({
        "@context":"https://schema.org",
        "@type":"BreadcrumbList",
        "itemListElement":[
          {"@type":"ListItem","position":1,"name":"Inicio","item":"https://inmotivo.com/"},
          {"@type":"ListItem","position":2,"name": cityName,"item": `https://inmotivo.com/${citySlug}/arriendo`},
          {"@type":"ListItem","position":3,"name": typeName,"item": `https://inmotivo.com/${citySlug}/arriendo/${typeSlug}`},
          {"@type":"ListItem","position":4,"name": barrioName,"item": canonical}
        ]
      });
      document.head.appendChild(ld);
    }
  }, [heading, cityName, typeName, canonical, isBarrio, barrioName, citySlug, typeSlug]);

  const baseQuery = encodeURIComponent(typeSlug.slice(0,-1));

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold mb-3">{heading}</h1>
      <p className="text-muted-foreground mb-6">
        Explora el mapa con GPS en tiempo real. Ajusta el radio y recibe opciones cercanas a tu ruta.
      </p>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          to={`/navegacion?query=${baseQuery}&autostart=true`}
          className="inline-flex items-center rounded-xl px-4 py-2 bg-green-600 text-white hover:bg-green-700"
        >Ver en mapa (navegación)</Link>
        <Link
          to={`/navegacion?query=${baseQuery}`}
          className="inline-flex items-center rounded-xl px-4 py-2 border border-green-600 text-green-700 hover:bg-green-50"
        >Buscar en mapa</Link>
      </div>

      {!isBarrio && barrios.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Barrios populares</h2>
          <div className="flex flex-wrap gap-2">
            {barrios.map((b) => {
              const slug = b.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"-");
              return (
                <Link key={b} to={`${basePath}/${slug}`} className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">
                  {b}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="prose max-w-none">
        <h2>¿Cómo funciona?</h2>
        <ol>
          <li>Describe lo que buscas o usa las sugerencias.</li>
          <li>Activa el modo navegación para que el mapa te siga en tiempo real.</li>
          <li>Recibe alertas cerca de las zonas que te interesan.</li>
        </ol>
        <p className="mt-4">INMOTIVO te ayuda a decidir mejor: ve precios, zonas y opciones cercanas a tu ruta diaria.</p>
      </div>
    </div>
  );
}
