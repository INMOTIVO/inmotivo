import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PropertiesGrid from "@/components/PropertiesGrid";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <Hero />
        <PropertiesGrid />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
