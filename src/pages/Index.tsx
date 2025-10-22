import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorksVideo from "@/components/HowItWorksVideo";
import PropertiesGrid from "@/components/PropertiesGrid";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <Hero />
        <HowItWorksVideo />
        <PropertiesGrid />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
