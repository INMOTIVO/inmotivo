import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { usePageTracking } from "@/hooks/usePageTracking";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PropertyDetail from "./pages/PropertyDetail";
import MapSearch from "./pages/MapSearch";
import Navigate from "./pages/Navigate";
import PublishProperty from "./pages/PublishProperty";
import PropertiesCatalog from "./pages/PropertiesCatalog";
import AdCreativesPreview from "./pages/AdCreativesPreview";
import ProviderDashboard from "./pages/ProviderDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CreateProperty from "./pages/CreateProperty";
import Favorites from "./pages/Favorites";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  usePageTracking();
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/property/:id" element={<PropertyDetail />} />
      <Route path="/mapa" element={<MapSearch />} />
      <Route path="/navegacion" element={<Navigate />} />
      <Route path="/catalogo" element={<PropertiesCatalog />} />
      <Route path="/publicar" element={<PublishProperty />} />
      <Route path="/dashboard" element={<ProviderDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/create-property" element={<CreateProperty />} />
      <Route path="/edit-property/:id" element={<CreateProperty />} />
      <Route path="/marketing-preview" element={<AdCreativesPreview />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
