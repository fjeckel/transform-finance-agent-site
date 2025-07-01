import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AdminRoute from "./components/AdminRoute";
import CookieConsent from "./components/CookieConsent";
import Index from "./pages/Index";
import Episode from "./pages/Episode";
import Episodes from "./pages/Episodes";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Legal from "./pages/Legal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();


const getCookie = (name: string) => {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : undefined;
};

const App = () => {
  useEffect(() => {
    if (getCookie('cookieConsent')) {
      const count = parseInt(getCookie('visitCount') ?? '0', 10) || 0;
      const newCount = count + 1;
      const oneYear = 60 * 60 * 24 * 365;
      document.cookie = `visitCount=${newCount}; path=/; max-age=${oneYear}`;
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CookieConsent />
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/episode" element={<Episode />} />
              <Route path="/episodes" element={<Episodes />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};
main

export default App;
