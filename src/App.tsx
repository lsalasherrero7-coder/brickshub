import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import PropertyList from "@/pages/PropertyList";
import PropertyForm from "@/pages/PropertyForm";
import CalendarPage from "@/pages/CalendarPage";
import CaptacionPage from "@/pages/CaptacionPage";
import ContabilidadPage from "@/pages/ContabilidadPage";
import ContactosPage from "@/pages/ContactosPage";
import ContactDetailPage from "@/pages/ContactDetailPage";
import MarketingLeadsPage from "@/pages/MarketingLeadsPage";
import MarketingLeadDetailPage from "@/pages/MarketingLeadDetailPage";
import HipotecaPage from "@/pages/HipotecaPage";
import GoogleCallbackPage from "@/pages/GoogleCallbackPage";
import LoginPage from "@/pages/LoginPage";
import AdminUsersPage from "@/pages/AdminUsersPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
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
        <Route path="/hipoteca" element={<HipotecaPage />} />
        <Route path="/usuarios" element={<AdminUsersPage />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/contabilidad" element={<ContabilidadPage />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/google-callback" element={<GoogleCallbackPage />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
