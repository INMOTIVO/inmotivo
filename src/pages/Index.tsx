import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorksVideo from "@/components/HowItWorksVideo";
import PropertiesGrid from "@/components/PropertiesGrid";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import MapFilters from "@/components/MapFilters";

const Index = () => {
  const navigate = useNavigate();

  const handleFiltersChange = (filters: any) => {
    const params = new URLSearchParams();
    if (filters.radius) params.set('radius', filters.radius.toString());
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.bedrooms) params.set('bedrooms', filters.bedrooms.toString());
    if (filters.propertyType) params.set('propertyType', filters.propertyType);
    
    navigate(`/map-search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <Hero />
        
        {/* Búsqueda inteligente con voz */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <MapFilters onFiltersChange={handleFiltersChange} />
        </section>

        <HowItWorksVideo />
        <PropertiesGrid />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
