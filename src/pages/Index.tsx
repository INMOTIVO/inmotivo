import { useNavigate } from "react-router-dom";
import HomeMenu from "@/components/HomeMenu";
import Hero from "@/components/Hero";
import HowItWorksVideo from "@/components/HowItWorksVideo";
import PropertiesGrid from "@/components/PropertiesGrid";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return <div className="min-h-screen">
      <HomeMenu />
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