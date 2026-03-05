import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import PropertyList from "@/pages/PropertyList";
import PropertyForm from "@/pages/PropertyForm";
import CalendarPage from "@/pages/CalendarPage";
import CaptacionPage from "@/pages/CaptacionPage";
import ContactosPage from "@/pages/ContactosPage";
import ContactDetailPage from "@/pages/ContactDetailPage";
import MarketingLeadsPage from "@/pages/MarketingLeadsPage";
import MarketingLeadDetailPage from "@/pages/MarketingLeadDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/propiedades" element={<PropertyList />} />
            <Route path="/propiedades/nueva" element={<PropertyForm />} />
            <Route path="/propiedades/:id" element={<PropertyForm />} />
            <Route path="/captacion" element={<CaptacionPage />} />
            <Route path="/contactos" element={<ContactosPage />} />
            <Route path="/contactos/:id" element={<ContactDetailPage />} />
            <Route path="/leads" element={<MarketingLeadsPage />} />
            <Route path="/leads/:id" element={<MarketingLeadDetailPage />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
