import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorksVideo from "@/components/HowItWorksVideo";
import PropertiesGrid from "@/components/PropertiesGrid";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { usePageView } from "@/hooks/usePageView";

const Index = () => {
  usePageView();
  
  return <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <Hero />
        <HowItWorksVideo />
        <PropertiesGrid />
        <CTASection />
      </main>
      <Footer className="px-0 py-px" />
    </div>;
};
export default Index;