import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AdminRoute from "./components/AdminRoute";
import CookieConsent from "./components/CookieConsent";
import Index from "./pages/Index";
import Episode from "./pages/Episode";
import Episodes from "./pages/Episodes";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AdminAnalytics from "./pages/AdminAnalytics";
import NewEpisode from "./pages/NewEpisode";
import EditEpisode from "./pages/EditEpisode";
import Legal from "./pages/Legal";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();


const getCookie = (name: string) => {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : undefined;
};

const App = () => {
  useEffect(() => {
    const logVisit = async () => {
      if (getCookie('cookieConsent')) {
        const count = parseInt(getCookie('visitCount') ?? '0', 10) || 0;
        const newCount = count + 1;
        const oneYear = 60 * 60 * 24 * 365;
        document.cookie = `visitCount=${newCount}; path=/; max-age=${oneYear}`;

        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('page_visit_logs').insert({
          page: window.location.pathname,
          user_id: user?.id ?? null,
        });
      }
    };
    logVisit();
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
              <Route path="/episode/:slug" element={<Episode />} />
              <Route path="/episodes" element={<Episodes />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              <Route path="/admin/episodes/new" element={<AdminRoute><NewEpisode /></AdminRoute>} />
              <Route path="/admin/episodes/:id/edit" element={<AdminRoute><EditEpisode /></AdminRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
