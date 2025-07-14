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
import ErrorBoundary from "./components/ui/error-boundary";
import { useServiceWorker } from "./hooks/useServiceWorker";
import { usePerformanceMonitoring } from "./hooks/usePerformanceMonitoring";
import { NetworkIndicator } from "./components/ui/network-indicator";
import RouterWithTracking from "./components/RouterWithTracking";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});


const getCookie = (name: string) => {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : undefined;
};

const App = () => {
  useServiceWorker();
  const performanceMetrics = usePerformanceMonitoring();

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

  // Log performance metrics in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && performanceMetrics) {
      console.log('Performance Metrics:', performanceMetrics);
    }
  }, [performanceMetrics]);

  return (
    <ErrorBoundary>
      <NetworkIndicator />
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CookieConsent />
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <RouterWithTracking />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
